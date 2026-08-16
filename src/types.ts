/**
 * Domain types for Sauce Atlas.
 *
 * Extending the atlas means editing JSON, not code:
 *   - a new sauce            -> append an object to src/data/recipes.json
 *   - a new ingredient       -> append to src/data/ingredients.json
 *   - a new cuisine or seal  -> append to src/data/cuisines.json
 * Flavour, category and country filters are derived from the data at runtime,
 * so new values show up in the filter rail on their own.
 */

/** A pantry item. `id` is the key recipes refer to. */
export interface Ingredient {
  id: string
  label: string
  /** Shelf it sits on in the pantry list. Any new string creates a new shelf. */
  group: string
  /** Whether it is currently in the pantry. The user can toggle this. */
  owned: boolean
  /** Short aside shown under the name. */
  note?: string
  /** Salt, water, oil and proteins: present in recipes, never counted as missing. */
  ignoreForMatching?: boolean
  /** Set when the ingredient is itself made from a recipe in this atlas. */
  recipeId?: string
  /** Listed for the pantry but not yet used by any recipe. Silences the data checker. */
  wishlist?: boolean
}

/** One line in a recipe's ingredient list. */
export interface RecipeIngredient {
  id: string
  amount: string
  optional?: boolean
  /** A documented stand-in. Presence of this means a missing item is workable. */
  sub?: string
}

export interface Cuisine {
  id: string
  label: string
  country: string
  /** Character stamped into the seal mark on every card. */
  seal: string
  accent: AccentName
}

export type AccentName = 'lacquer' | 'cinnabar' | 'jade' | 'lapis' | 'gold' | 'ink'

export interface Recipe {
  id: string
  name: string
  nativeName?: string | null
  cuisine: string
  region?: string | null
  category: string
  flavors: string[]
  /** 0 none, 3 punishing. */
  heat: number
  /** 0 none, 3 dessert-adjacent. Used by the "nothing sweet" filter. */
  sweetness: number
  blurb: string
  ingredients: RecipeIngredient[]
  method: string[]
  uses: string[]
  note?: string
  keeps?: string
}

/** A recipe plus the pantry maths for the current pantry state. */
export interface ScoredRecipe {
  recipe: Recipe
  cuisine: Cuisine
  /** Ingredients not owned, with no stand-in, not optional. */
  missing: Ingredient[]
  /** Ingredients not owned but with a documented stand-in. */
  standIns: RecipeIngredient[]
  status: 'ready' | 'stand-in' | 'short'
}

export type SortKey = 'default' | 'heat' | 'sweetness' | 'name'

/** Which palette is on. Written to `data-theme` on <html>; the CSS reads it there. */
export type Theme = 'light' | 'dark'

export interface Filters {
  query: string
  cuisines: string[]
  countries: string[]
  flavors: string[]
  categories: string[]
  /** Only show what the pantry can cover. */
  pantryOnly: boolean
  /** Allow documented stand-ins to count as covered. */
  allowStandIns: boolean
  /** Hide anything with sweetness above this. 3 = no limit. */
  maxSweetness: number
  minHeat: number
  sort: SortKey
}
