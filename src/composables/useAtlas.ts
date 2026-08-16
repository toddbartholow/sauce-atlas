import { computed, reactive, ref, watch } from 'vue'
import type {
  Cuisine,
  Filters,
  Ingredient,
  Recipe,
  RecipeIngredient,
  ScoredRecipe,
  SortKey,
  Theme
} from '../types'
import recipeData from '../data/recipes.json'
import ingredientData from '../data/ingredients.json'
import cuisineData from '../data/cuisines.json'

const recipes = recipeData as Recipe[]
const cuisines = cuisineData as Cuisine[]

/* ---------- pantry ----------
   Pantry state lives here, and it persists. Only deliberate deviations from
   the shipped data are stored, so an ingredient added to the JSON later keeps
   its authored default instead of inheriting a stale snapshot. */

const PANTRY_KEY = 'sauce-atlas-pantry'

/** localStorage throws on a file:// origin in some browsers, and the build is one file. */
function storedPantry(): Record<string, boolean> {
  try {
    const parsed = JSON.parse(localStorage.getItem(PANTRY_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const shippedOwned = new Map((ingredientData as Ingredient[]).map((i) => [i.id, i.owned]))
const ownedOverrides = storedPantry()

const pantry = ref<Ingredient[]>(
  (ingredientData as Ingredient[]).map((i) => ({ ...i, owned: ownedOverrides[i.id] ?? i.owned }))
)

watch(
  pantry,
  (items) => {
    const overrides: Record<string, boolean> = {}
    for (const item of items) {
      if (item.owned !== shippedOwned.get(item.id)) overrides[item.id] = item.owned
    }
    try {
      localStorage.setItem(PANTRY_KEY, JSON.stringify(overrides))
    } catch {
      /* nothing to do; the ticks still hold for this session */
    }
  },
  { deep: true }
)

/* ---------- palette ----------
   Unlike the pantry, a chosen palette persists: someone who wants the dark one
   wants it every time. Until they choose, the operating system decides and keeps
   deciding. `data-theme` on <html> is what the CSS reads; index.html sets it
   before first paint so there is no flash of the wrong paper. */

const THEME_KEY = 'sauce-atlas-theme'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

/** localStorage throws on a file:// origin in some browsers, and the build is one file. */
function storedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'dark' || saved === 'light' ? saved : null
  } catch {
    return null
  }
}

export const theme = ref<Theme>(storedTheme() ?? (darkQuery.matches ? 'dark' : 'light'))

watch(theme, (value) => (document.documentElement.dataset.theme = value), { immediate: true })

/** Follow the system until the reader overrides it by hand. */
darkQuery.addEventListener('change', (e) => {
  if (!storedTheme()) theme.value = e.matches ? 'dark' : 'light'
})

export function toggleTheme(): void {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(THEME_KEY, theme.value)
  } catch {
    /* nothing to do; the choice still holds for this session */
  }
}

const byId = computed(() => new Map(pantry.value.map((i) => [i.id, i])))
const cuisineById = new Map(cuisines.map((c) => [c.id, c]))

const fallbackCuisine: Cuisine = {
  id: 'unknown',
  label: 'Unfiled',
  country: 'Unknown',
  seal: '?',
  accent: 'ink'
}

export const filters = reactive<Filters>({
  query: '',
  cuisines: [],
  countries: [],
  flavors: [],
  categories: [],
  pantryOnly: false,
  allowStandIns: true,
  maxSweetness: 3,
  minHeat: 0,
  sort: 'default'
})

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

/** Facets are derived, so adding data to the JSON adds filters automatically. */
export const facets = computed(() => ({
  cuisines: cuisines.filter((c) => recipes.some((r) => r.cuisine === c.id)),
  countries: unique(recipes.map((r) => cuisineById.get(r.cuisine)?.country ?? 'Unknown')),
  flavors: unique(recipes.flatMap((r) => r.flavors)),
  categories: unique(recipes.map((r) => r.category))
}))

function scoreRecipe(recipe: Recipe): ScoredRecipe {
  const missing: Ingredient[] = []
  const standIns: RecipeIngredient[] = []

  for (const line of recipe.ingredients) {
    const item = byId.value.get(line.id)
    if (!item || item.ignoreForMatching || item.owned || line.optional) continue
    if (line.sub) standIns.push(line)
    else missing.push(item)
  }

  const status: ScoredRecipe['status'] =
    missing.length > 0 ? 'short' : standIns.length > 0 ? 'stand-in' : 'ready'

  return {
    recipe,
    cuisine: cuisineById.get(recipe.cuisine) ?? fallbackCuisine,
    missing,
    standIns,
    status
  }
}

export const scored = computed<ScoredRecipe[]>(() => recipes.map(scoreRecipe))

function matchesQuery(entry: ScoredRecipe, query: string): boolean {
  if (!query) return true
  const needles = query.toLowerCase().split(/\s+/).filter(Boolean)
  const r = entry.recipe
  const haystack = [
    r.name,
    r.nativeName ?? '',
    r.blurb,
    r.note ?? '',
    r.category,
    r.region ?? '',
    entry.cuisine.label,
    entry.cuisine.country,
    ...r.flavors,
    ...r.uses,
    ...r.method,
    ...r.ingredients.map((line) => byId.value.get(line.id)?.label ?? line.id)
  ]
    .join(' ')
    .toLowerCase()
  return needles.every((n) => haystack.includes(n))
}

/** Ready first, then things needing a stand-in, then things you cannot make yet. */
const statusRank: Record<ScoredRecipe['status'], number> = { ready: 0, 'stand-in': 1, short: 2 }

const sorters: Record<SortKey, (a: ScoredRecipe, b: ScoredRecipe) => number> = {
  default: (a, b) =>
    statusRank[a.status] - statusRank[b.status] || a.recipe.name.localeCompare(b.recipe.name),
  heat: (a, b) => b.recipe.heat - a.recipe.heat || a.recipe.name.localeCompare(b.recipe.name),
  sweetness: (a, b) =>
    a.recipe.sweetness - b.recipe.sweetness || a.recipe.name.localeCompare(b.recipe.name),
  name: (a, b) => a.recipe.name.localeCompare(b.recipe.name)
}

export const results = computed<ScoredRecipe[]>(() => {
  const f = filters
  return scored.value
    .filter((entry) => {
      const r = entry.recipe
      if (!matchesQuery(entry, f.query.trim())) return false
      if (f.cuisines.length && !f.cuisines.includes(r.cuisine)) return false
      if (f.countries.length && !f.countries.includes(entry.cuisine.country)) return false
      if (f.categories.length && !f.categories.includes(r.category)) return false
      if (f.flavors.length && !f.flavors.every((flavor) => r.flavors.includes(flavor))) return false
      if (r.sweetness > f.maxSweetness) return false
      if (r.heat < f.minHeat) return false
      if (f.pantryOnly) {
        if (entry.status === 'short') return false
        if (!f.allowStandIns && entry.status === 'stand-in') return false
      }
      return true
    })
    .sort(sorters[f.sort])
})

export const shoppingList = computed(() => {
  const counts = new Map<string, { ingredient: Ingredient; count: number }>()
  for (const entry of scored.value) {
    for (const item of entry.missing) {
      const found = counts.get(item.id)
      if (found) found.count += 1
      else counts.set(item.id, { ingredient: item, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)
})

/* ---------- the rail ----------
   Which sections are folded is chrome, not content. It lives here so anything
   can open a section — a filter set while its fold is shut must not vanish —
   and it deliberately does not persist: the palette is the only thing that
   survives a reload. On a small screen everything starts shut; the drawer is
   the whole viewport there. */

const smallScreen = window.matchMedia('(max-width: 900px)').matches

export const sectionOpen = reactive<Record<string, boolean>>({
  shelves: false,
  origin: false,
  taste: !smallScreen,
  balance: !smallScreen,
  kind: false,
  buy: false
})

/** One shelf open at a time; the pantry reads like a cabinet. */
export const openShelf = ref<string | null>(null)

export function toggleShelf(name: string): void {
  openShelf.value = openShelf.value === name ? null : name
}

/** Hide owned rows in the checklist. View state only; results never read it. */
export const missingOnly = ref(false)

export const ownedCount = computed(
  () => pantry.value.filter((i) => i.owned && !i.ignoreForMatching).length
)
export const matchableCount = computed(
  () => pantry.value.filter((i) => !i.ignoreForMatching).length
)
export const matchableIds = computed(() =>
  pantry.value.filter((i) => !i.ignoreForMatching).map((i) => i.id)
)

export interface Shelf {
  name: string
  items: Ingredient[]
  owned: number
  total: number
}

export const shelves = computed<Shelf[]>(() => {
  const groups = new Map<string, Ingredient[]>()
  for (const item of pantry.value) {
    if (item.ignoreForMatching) continue
    const list = groups.get(item.group) ?? []
    list.push(item)
    groups.set(item.group, list)
  }
  return [...groups.entries()]
    .map(([name, all]) => ({
      name,
      items: missingOnly.value ? all.filter((i) => !i.owned) : all,
      owned: all.filter((i) => i.owned).length,
      total: all.length
    }))
    .filter((shelf) => shelf.items.length > 0)
})

/** The words the balance dials speak. Index is the stored 0-3 value. */
export const SWEET_LABELS = ['none at all', 'barely', 'moderate', 'anything'] as const
export const HEAT_LABELS = ['any', 'some', 'hot', 'punishing'] as const

/** Per-section live counts, so a folded section can still show what it holds. */
export const filterCounts = computed(() => ({
  origin: filters.cuisines.length + filters.countries.length,
  taste: filters.flavors.length,
  balance: (filters.maxSweetness < 3 ? 1 : 0) + (filters.minHeat > 0 ? 1 : 0),
  kind: filters.categories.length
}))

/** A filter set while its section is folded would be invisible; unfold it. */
watch(filterCounts, (now, before) => {
  for (const key of ['origin', 'taste', 'balance', 'kind'] as const) {
    if (now[key] > (before?.[key] ?? 0)) sectionOpen[key] = true
  }
})

/** What a folded section would say, one line, ellipsised by the rail. */
export const sectionSummaries = computed(() => {
  const f = filters
  const sweet = ['no sweetness', 'barely sweet', 'moderately sweet', ''][f.maxSweetness]
  const heat = ['', 'some heat', 'hot only', 'punishing only'][f.minHeat]
  const origin = [...f.cuisines.map((id) => cuisineById.get(id)?.label ?? id), ...f.countries]
  const buy = shoppingList.value
  return {
    shelves: `${ownedCount.value} of ${matchableCount.value} on hand`,
    origin: origin.join(', '),
    balance: [sweet, heat].filter(Boolean).join(' · '),
    kind: f.categories.join(', '),
    buy:
      buy.length === 0
        ? 'nothing is missing'
        : buy.length === 1
          ? buy[0].ingredient.label
          : `${buy[0].ingredient.label} and ${buy.length - 1} more`
  }
})

export function toggleIngredient(id: string): void {
  const item = pantry.value.find((i) => i.id === id)
  if (item) item.owned = !item.owned
}

export function setPantry(ids: string[], owned: boolean): void {
  const wanted = new Set(ids)
  for (const item of pantry.value) if (wanted.has(item.id)) item.owned = owned
}

export function toggleFacet(list: string[], value: string): void {
  const at = list.indexOf(value)
  if (at === -1) list.push(value)
  else list.splice(at, 1)
}

export function resetFilters(): void {
  filters.query = ''
  filters.cuisines = []
  filters.countries = []
  filters.flavors = []
  filters.categories = []
  filters.pantryOnly = false
  filters.allowStandIns = true
  filters.maxSweetness = 3
  filters.minHeat = 0
  filters.sort = 'default'
}

export const activeFilterCount = computed(
  () =>
    filters.cuisines.length +
    filters.countries.length +
    filters.flavors.length +
    filters.categories.length +
    (filters.pantryOnly ? 1 : 0) +
    (filters.maxSweetness < 3 ? 1 : 0) +
    (filters.minHeat > 0 ? 1 : 0) +
    (filters.query.trim() ? 1 : 0)
)

export function ingredient(id: string): Ingredient | undefined {
  return byId.value.get(id)
}

export function recipeById(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id)
}

export { pantry, recipes, cuisines }
