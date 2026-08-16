#!/usr/bin/env node
/**
 * Validates the JSON content layer before it reaches the app.
 * Runs on `npm run check` and automatically before `npm run build`.
 *
 * TypeScript checks the shape of the code; nothing checks that a recipe's
 * ingredient id actually exists. This does.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (name) => JSON.parse(readFileSync(join(root, 'src/data', name), 'utf8'))

const recipes = load('recipes.json')
const ingredients = load('ingredients.json')
const cuisines = load('cuisines.json')

const errors = []
const warnings = []
const fail = (msg) => errors.push(msg)

const ACCENTS = new Set(['lacquer', 'cinnabar', 'jade', 'lapis', 'gold', 'ink'])
const REQUIRED = ['id', 'name', 'cuisine', 'category', 'flavors', 'heat', 'sweetness', 'blurb', 'ingredients', 'method', 'uses']

// --- ingredients ------------------------------------------------------------
const ingredientIds = new Set()
for (const item of ingredients) {
  if (!item.id || !item.label || !item.group) fail(`ingredient missing id, label or group: ${JSON.stringify(item)}`)
  if (ingredientIds.has(item.id)) fail(`duplicate ingredient id: ${item.id}`)
  ingredientIds.add(item.id)
  if (typeof item.owned !== 'boolean') fail(`ingredient ${item.id}: owned must be true or false`)
}

// --- cuisines ---------------------------------------------------------------
const cuisineIds = new Set()
for (const c of cuisines) {
  if (cuisineIds.has(c.id)) fail(`duplicate cuisine id: ${c.id}`)
  cuisineIds.add(c.id)
  if (!c.seal) fail(`cuisine ${c.id}: needs a seal glyph`)
  if (!c.country) fail(`cuisine ${c.id}: needs a country`)
  if (!ACCENTS.has(c.accent)) fail(`cuisine ${c.id}: accent "${c.accent}" is not one of ${[...ACCENTS].join(', ')}`)
}

// --- recipes ----------------------------------------------------------------
const recipeIds = new Set()
const usedIngredients = new Set()

for (const r of recipes) {
  const where = r.id || r.name || '(unnamed)'
  for (const key of REQUIRED) {
    if (r[key] === undefined || r[key] === null) fail(`${where}: missing "${key}"`)
  }
  if (recipeIds.has(r.id)) fail(`duplicate recipe id: ${r.id}`)
  recipeIds.add(r.id)

  if (!cuisineIds.has(r.cuisine)) fail(`${where}: cuisine "${r.cuisine}" is not in cuisines.json`)

  for (const scale of ['heat', 'sweetness']) {
    const v = r[scale]
    if (!Number.isInteger(v) || v < 0 || v > 3) fail(`${where}: ${scale} must be an integer 0-3, got ${v}`)
  }

  if (!Array.isArray(r.flavors) || r.flavors.length === 0) fail(`${where}: needs at least one flavour`)
  if (!Array.isArray(r.method) || r.method.length === 0) fail(`${where}: needs at least one method step`)
  if (!Array.isArray(r.uses) || r.uses.length === 0) fail(`${where}: needs at least one use`)

  const seen = new Set()
  for (const line of r.ingredients ?? []) {
    if (!ingredientIds.has(line.id)) fail(`${where}: ingredient "${line.id}" is not in ingredients.json`)
    if (seen.has(line.id)) fail(`${where}: ingredient "${line.id}" listed twice`)
    seen.add(line.id)
    usedIngredients.add(line.id)
    if (!line.amount) fail(`${where}: ingredient "${line.id}" has no amount`)
  }
}

// --- cross references -------------------------------------------------------
for (const item of ingredients) {
  if (item.recipeId && !recipeIds.has(item.recipeId)) {
    fail(`ingredient ${item.id}: recipeId "${item.recipeId}" does not exist`)
  }
  if (!usedIngredients.has(item.id) && !item.ignoreForMatching && !item.wishlist) {
    warnings.push(`ingredient ${item.id} is never used by any recipe`)
  }
}

for (const c of cuisines) {
  if (!recipes.some((r) => r.cuisine === c.id)) warnings.push(`cuisine ${c.id} has no recipes`)
}

// --- report -----------------------------------------------------------------
const flavors = [...new Set(recipes.flatMap((r) => r.flavors))].sort()
const categories = [...new Set(recipes.map((r) => r.category))].sort()

for (const w of warnings) console.warn(`  warning  ${w}`)

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} in src/data:\n`)
  for (const e of errors) console.error(`  ${e}`)
  console.error('')
  process.exit(1)
}

console.log(
  `\n  ${recipes.length} recipes · ${ingredients.length} ingredients · ${cuisines.length} cuisines\n` +
    `  tastes:     ${flavors.join(', ')}\n` +
    `  categories: ${categories.join(', ')}\n` +
    `  data ok\n`
)
