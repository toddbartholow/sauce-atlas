<script setup lang="ts">
import {
  activeFilterCount,
  facets,
  filterCounts,
  filters,
  HEAT_LABELS,
  matchableCount,
  matchableIds,
  missingOnly,
  openShelf,
  ownedCount,
  resetFilters,
  sectionOpen,
  sectionSummaries,
  setPantry,
  shelves,
  shoppingList,
  SWEET_LABELS,
  toggleFacet,
  toggleIngredient,
  toggleShelf
} from '../composables/useAtlas'
import RailSection from './RailSection.vue'

const emit = defineEmits<{ (e: 'open-recipe', id: string): void }>()

/** DOM ids need something tamer than "Soy & ferments". */
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
</script>

<template>
  <aside class="rail" aria-label="Filters">
    <!-- The premise. Two switches, never folded away. -->
    <section class="fixed">
      <h2 class="fixed__title"><span class="eyebrow">Pantry</span></h2>
      <label class="switch">
        <input type="checkbox" v-model="filters.pantryOnly" />
        <span>Only what I can make</span>
      </label>
      <label class="switch switch--sub" :class="{ 'switch--off': !filters.pantryOnly }">
        <input type="checkbox" v-model="filters.allowStandIns" :disabled="!filters.pantryOnly" />
        <span>Count documented stand-ins</span>
      </label>
    </section>

    <!-- Pantry shelves ------------------------------------------------------>
    <RailSection
      id="shelves"
      label="Pantry shelves"
      :tally="`${ownedCount}/${matchableCount}`"
      :spoken="`${ownedCount} of ${matchableCount} ingredients on hand`"
      :summary="sectionSummaries.shelves"
      v-model="sectionOpen.shelves"
    >
      <label class="switch">
        <input type="checkbox" v-model="missingOnly" />
        <span>Only what I'm missing</span>
      </label>

      <div class="bulk">
        <button
          type="button"
          aria-label="Check every pantry ingredient"
          @click="setPantry(matchableIds, true)"
        >
          Check all
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          aria-label="Clear the whole pantry"
          @click="setPantry(matchableIds, false)"
        >
          Clear
        </button>
      </div>

      <div v-for="shelf in shelves" :key="shelf.name" class="shelf">
        <button
          :id="`shelf-${slug(shelf.name)}`"
          type="button"
          class="shelf__head"
          :aria-expanded="openShelf === shelf.name"
          :aria-controls="`shelf-${slug(shelf.name)}-list`"
          @click="toggleShelf(shelf.name)"
        >
          <span class="shelf__name">{{ shelf.name }}</span>
          <span class="shelf__tally" aria-hidden="true">{{ shelf.owned }}/{{ shelf.total }}</span>
          <span class="sr-only">, {{ shelf.owned }} of {{ shelf.total }} on hand</span>
        </button>
        <div
          v-show="openShelf === shelf.name"
          :id="`shelf-${slug(shelf.name)}-list`"
          role="group"
          :aria-labelledby="`shelf-${slug(shelf.name)}`"
        >
          <ul class="shelf__list">
            <li v-for="item in shelf.items" :key="item.id" class="row">
              <label class="tick" :class="{ 'tick--on': item.owned }">
                <input type="checkbox" :checked="item.owned" @change="toggleIngredient(item.id)" />
                <span class="tick__box" aria-hidden="true"></span>
                <span class="tick__text">
                  {{ item.label }}
                  <em v-if="item.note">{{ item.note }}</em>
                </span>
              </label>
              <button
                v-if="item.recipeId"
                class="tick__link"
                type="button"
                :aria-label="`Recipe for ${item.label}`"
                @click="emit('open-recipe', item.recipeId)"
              >
                Recipe
              </button>
            </li>
          </ul>
        </div>
      </div>
    </RailSection>

    <!-- Origin ------------------------------------------------------------->
    <RailSection
      id="origin"
      label="Origin"
      :count="filterCounts.origin"
      :summary="sectionSummaries.origin"
      v-model="sectionOpen.origin"
    >
      <p class="subhead">Cuisine</p>
      <div class="tags">
        <button
          v-for="c in facets.cuisines"
          :key="c.id"
          type="button"
          class="tag"
          :class="{ 'tag--on': filters.cuisines.includes(c.id) }"
          :aria-pressed="filters.cuisines.includes(c.id)"
          @click="toggleFacet(filters.cuisines, c.id)"
        >
          {{ c.label }}
        </button>
      </div>
      <p class="subhead">Country</p>
      <div class="tags">
        <button
          v-for="country in facets.countries"
          :key="country"
          type="button"
          class="tag"
          :class="{ 'tag--on': filters.countries.includes(country) }"
          :aria-pressed="filters.countries.includes(country)"
          @click="toggleFacet(filters.countries, country)"
        >
          {{ country }}
        </button>
      </div>
    </RailSection>

    <!-- Taste -------------------------------------------------------------->
    <RailSection
      id="taste"
      label="Taste"
      :count="filterCounts.taste"
      v-model="sectionOpen.taste"
    >
      <template v-if="filters.flavors.length" #summary>
        <template v-for="(flavor, i) in filters.flavors" :key="flavor">
          <span :class="`taste-${flavor.toLowerCase()}`">{{ flavor }}</span
          ><template v-if="i < filters.flavors.length - 1">, </template>
        </template>
      </template>
      <p class="hint">Picking two shows sauces that are both.</p>
      <div class="tags">
        <button
          v-for="flavor in facets.flavors"
          :key="flavor"
          type="button"
          class="tag"
          :class="[`taste-${flavor.toLowerCase()}`, { 'tag--on': filters.flavors.includes(flavor) }]"
          :aria-pressed="filters.flavors.includes(flavor)"
          @click="toggleFacet(filters.flavors, flavor)"
        >
          {{ flavor }}
        </button>
      </div>
    </RailSection>

    <!-- Balance ------------------------------------------------------------>
    <RailSection
      id="balance"
      label="Balance"
      :count="filterCounts.balance"
      :summary="sectionSummaries.balance"
      v-model="sectionOpen.balance"
    >
      <label class="dial">
        <span class="dial__label">Sweetness ceiling</span>
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          v-model.number="filters.maxSweetness"
          :aria-valuetext="SWEET_LABELS[filters.maxSweetness]"
        />
        <span class="dial__value" aria-hidden="true">{{ SWEET_LABELS[filters.maxSweetness] }}</span>
      </label>
      <label class="dial">
        <span class="dial__label">Heat floor</span>
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          v-model.number="filters.minHeat"
          :aria-valuetext="HEAT_LABELS[filters.minHeat]"
        />
        <span class="dial__value" aria-hidden="true">{{ HEAT_LABELS[filters.minHeat] }}</span>
      </label>
    </RailSection>

    <!-- Kind ----------------------------------------------------------------->
    <RailSection
      id="kind"
      label="Kind"
      :count="filterCounts.kind"
      :summary="sectionSummaries.kind"
      v-model="sectionOpen.kind"
    >
      <div class="tags">
        <button
          v-for="cat in facets.categories"
          :key="cat"
          type="button"
          class="tag"
          :class="{ 'tag--on': filters.categories.includes(cat) }"
          :aria-pressed="filters.categories.includes(cat)"
          @click="toggleFacet(filters.categories, cat)"
        >
          {{ cat }}
        </button>
      </div>
    </RailSection>

    <!-- Shopping ------------------------------------------------------------>
    <RailSection
      id="buy"
      label="What is blocking you"
      :tally="shoppingList.length ? String(shoppingList.length) : undefined"
      :spoken="`${shoppingList.length} ingredients blocking recipes`"
      :summary="sectionSummaries.buy"
      v-model="sectionOpen.buy"
    >
      <p v-if="!shoppingList.length" class="hint">Nothing. Every formula is open to you.</p>
      <ol v-else class="buy">
        <li v-for="row in shoppingList" :key="row.ingredient.id">
          <span class="buy__name">{{ row.ingredient.label }}</span>
          <span class="buy__count">{{ row.count }}</span>
        </li>
      </ol>
    </RailSection>

    <button v-if="activeFilterCount" class="reset" type="button" @click="resetFilters">
      Clear {{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }}
    </button>
  </aside>
</template>

<style scoped>
.rail {
  font-family: var(--utility);
}

/* the fixed pantry block */
.fixed {
  border-top: 1px solid var(--rule-strong);
  padding: 0.7rem 0.1rem 0.9rem;
}
.fixed__title {
  margin: 0 0 0.4rem;
  font: inherit;
  color: var(--accent);
}

.hint {
  font-family: var(--body);
  font-size: 0.82rem;
  font-style: italic;
  color: var(--text-faint);
  margin: 0 0 0.5rem;
}

/* switches */
.switch {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.88rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0;
  cursor: pointer;
}
.switch input {
  accent-color: var(--accent);
}
.switch--sub {
  padding-left: 1.1rem;
  color: var(--text-soft);
}
.switch--off {
  opacity: 0.6;
}

.bulk {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  margin: 0.45rem 0 0.6rem;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.bulk button {
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* sub-labels inside a section (Cuisine, Country) */
.subhead {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0.9rem 0 0.35rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px dotted var(--rule-dotted);
}
.subhead:first-child {
  margin-top: 0;
}

/* pantry shelves: one drawer of the cabinet open at a time */
.shelf {
  margin-top: 0.55rem;
}
.shelf__head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.25rem 0 0.2rem;
  border-bottom: 1px dotted var(--rule-dotted);
  text-align: left;
}
.shelf__name {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.shelf__head:hover .shelf__name,
.shelf__head[aria-expanded='true'] .shelf__name {
  color: var(--text-soft);
}
.shelf__tally {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}
.shelf__list {
  list-style: none;
  margin: 0.35rem 0 0;
  padding: 0;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.row .tick {
  flex: 1;
}

.tick {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.18rem 0;
  min-height: 24px;
  cursor: pointer;
  color: var(--text-faint);
}
.tick input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.tick__box {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  margin-top: 0.28rem;
  border: 1px solid var(--text-faint);
  border-radius: 1px;
  background: transparent;
}
.tick--on {
  color: var(--text);
}
.tick--on .tick__box {
  background: var(--mark-have);
  border-color: var(--mark-have);
}
/* a drawn tick, so checked reads as a shape and not only a fill */
.tick--on .tick__box::after {
  content: '';
  position: absolute;
  left: 29%;
  top: 4%;
  width: 30%;
  height: 62%;
  border-right: 2px solid var(--tick-inset);
  border-bottom: 2px solid var(--tick-inset);
  transform: rotate(40deg);
}
.tick input:focus-visible + .tick__box {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.tick__text {
  font-size: 0.92rem;
  line-height: 1.35;
}
/* notes stay visible; appearing on hover moved the checkboxes under the cursor */
.tick__text em {
  display: block;
  font-family: var(--body);
  font-style: italic;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--text-faint);
  letter-spacing: 0;
}
.tick__link {
  font-family: var(--utility);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}
.tag {
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.18rem 0.55rem 0.12rem;
  min-height: 24px;
  border: 1px solid var(--field-border);
  border-radius: 1px;
  color: var(--taste-ink, var(--text-soft));
  background: var(--tag-bg);
  transition: background 0.15s ease, color 0.15s ease;
}
.tag:hover {
  border-color: var(--field-border-hover);
  background: var(--tag-bg-hover);
}
.tag--on {
  background: var(--accent-fill);
  border-color: var(--accent-edge);
  color: var(--on-accent);
}
.tag--on:hover {
  background: var(--accent-fill-hot);
  color: var(--on-accent);
}

/* dials */
.dial {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.2rem 0.6rem;
  margin-bottom: 0.7rem;
}
.dial__label {
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-soft);
}
.dial__value {
  font-family: var(--body);
  font-style: italic;
  font-size: 0.85rem;
  color: var(--accent);
  text-align: right;
}
.dial input[type='range'] {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--accent);
}

/* shopping */
.buy {
  list-style: none;
  margin: 0;
  padding: 0;
}
.buy li {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.22rem 0;
  border-bottom: 1px dotted var(--rule-dotted);
  font-size: 0.88rem;
}
.buy__count {
  color: var(--accent-hot);
  font-variant-numeric: tabular-nums;
}

/* Sticky footer: visible exactly when the rail is long enough to scroll. */
.reset {
  position: sticky;
  bottom: 0;
  margin-top: 1rem;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--accent);
  color: var(--accent);
  background: var(--surface-bar);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.reset:hover {
  background: var(--accent-fill);
  border-color: var(--accent-fill);
  color: var(--on-accent);
}

@media (pointer: coarse) {
  .tag {
    min-height: 40px;
    padding-inline: 0.9rem;
  }
  .tick {
    padding-block: 0.45rem;
  }
  .tick__box {
    width: 18px;
    height: 18px;
  }
  .tick__link {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
  }
}

@media (forced-colors: active) {
  .tag--on {
    border-width: 2px;
  }
  .tick--on .tick__box {
    forced-color-adjust: none;
  }
}
</style>
