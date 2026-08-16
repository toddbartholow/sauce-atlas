<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import TheHeader from './components/TheHeader.vue'
import FilterRail from './components/FilterRail.vue'
import RecipeCard from './components/RecipeCard.vue'
import RecipeDetail from './components/RecipeDetail.vue'
import { filters, recipes, results, scored, resetFilters } from './composables/useAtlas'

const openId = ref<string | null>(null)
const railOpen = ref(false)
const railToggle = ref<HTMLButtonElement | null>(null)

const openEntry = computed(() => scored.value.find((e) => e.recipe.id === openId.value) ?? null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    openId.value = null
    if (railOpen.value) {
      railOpen.value = false
      /* the drawer may hold focus; do not drop it on <body> */
      railToggle.value?.focus()
    }
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

/** Stop the grid scrolling underneath the open drawer. */
watch(openEntry, (entry) => {
  document.body.style.overflow = entry ? 'hidden' : ''
})
</script>

<template>
  <TheHeader />

  <div class="search">
    <div class="search__inner">
      <label class="search__field">
        <span class="sr-only">Search sauces</span>
        <input
          v-model="filters.query"
          type="search"
          placeholder="Search a sauce, an ingredient, a use — jaew, vinegar, grilled fish"
        />
      </label>
      <button
        ref="railToggle"
        class="search__toggle"
        type="button"
        :aria-expanded="railOpen"
        aria-controls="filter-rail"
        @click="railOpen = !railOpen"
      >
        {{ railOpen ? 'Hide' : 'Filters' }}
      </button>
    </div>
  </div>

  <main class="shell">
    <div id="filter-rail" class="shell__rail" :class="{ 'shell__rail--open': railOpen }">
      <FilterRail @open-recipe="(id) => (openId = id)" />
    </div>

    <div class="shell__main">
      <div class="gridbar">
        <h2 class="gridbar__count" aria-live="polite">
          {{ results.length }} of {{ recipes.length }} sauces
        </h2>
        <label class="gridbar__sort">
          <span>Order by</span>
          <select v-model="filters.sort">
            <option value="default">What I can make first</option>
            <option value="name">Name</option>
            <option value="heat">Hottest first</option>
            <option value="sweetness">Least sweet first</option>
          </select>
        </label>
      </div>

      <TransitionGroup v-if="results.length" name="deal" tag="div" class="grid">
        <RecipeCard
          v-for="entry in results"
          :key="entry.recipe.id"
          :entry="entry"
          @select="openId = entry.recipe.id"
        />
      </TransitionGroup>

      <div v-else class="empty">
        <p class="empty__glyph">空</p>
        <h2>Nothing matches that combination</h2>
        <p>Widen the taste filters, or turn off <em>only what I can make</em>.</p>
        <button @click="resetFilters">Clear all filters</button>
      </div>
    </div>
  </main>

  <footer class="colophon">
    <hr class="rule-foil" />
    <p>
      Green marks mean you have it, blue means a documented stand-in, red means a gap.
    </p>
  </footer>

  <RecipeDetail v-if="openEntry" :entry="openEntry" @close="openId = null" />
</template>

<style scoped>
.search {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--surface-bar);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--rule-strong);
}
.search__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0.7rem 1.75rem;
  display: flex;
  gap: 0.7rem;
  align-items: center;
}
.search__field {
  flex: 1;
  display: block;
}
.search__field input {
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--field-border);
  border-radius: 1px;
  background: var(--field-bg);
  font-family: var(--body);
  font-size: 0.98rem;
}
.search__field input::placeholder {
  color: var(--text-faint);
  font-style: italic;
}
.search__field input:focus {
  border-color: var(--field-border-hover);
  outline: none;
  box-shadow: 0 0 0 2px var(--field-ring);
}
.search__toggle {
  display: none;
  font-family: var(--utility);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--accent);
  color: var(--accent);
}

.shell {
  max-width: 1360px;
  margin: 0 auto;
  padding: 1.6rem 1.75rem 3rem;
  display: grid;
  grid-template-columns: var(--rail) minmax(0, 1fr);
  gap: 2.4rem;
  align-items: start;
}

.shell__rail {
  position: sticky;
  top: 4.2rem;
  max-height: calc(100vh - 5.5rem);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.gridbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.9rem;
}
.gridbar__count {
  margin: 0;
  font-family: var(--utility);
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.gridbar__sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--utility);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-soft);
}
.gridbar__sort select {
  padding: 0.3rem 0.4rem;
  border: 1px solid var(--field-border);
  border-radius: 1px;
  background: var(--field-bg);
  font-size: 0.85rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
  gap: 1.1rem;
}

.deal-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.deal-leave-active {
  transition: opacity 0.14s ease;
  position: absolute;
}
.deal-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.deal-leave-to {
  opacity: 0;
}
.deal-move {
  transition: transform 0.28s cubic-bezier(0.2, 0.7, 0.3, 1);
}

.empty {
  text-align: center;
  padding: 4rem 1rem;
  border: 1px dashed var(--rule-strong);
}
.empty__glyph {
  font-family: var(--seal-face);
  font-size: 4rem;
  color: var(--empty-glyph);
  margin: 0;
  line-height: 1;
}
.empty h2 {
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.5rem;
  margin: 0.6rem 0 0.3rem;
}
.empty p {
  color: var(--text-soft);
  margin: 0 0 1.2rem;
}
.empty button {
  font-family: var(--utility);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.5rem 1.1rem;
  border: 1px solid var(--accent);
  color: var(--accent);
}
.empty button:hover {
  background: var(--accent-fill);
  border-color: var(--accent-fill);
  color: var(--on-accent);
}

.colophon {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 1.75rem 2.5rem;
}
.colophon p {
  margin: 0.9rem 0 0;
  font-family: var(--utility);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  .search__inner {
    padding: 0.6rem 1rem;
  }
  .search__toggle {
    display: block;
  }
  .shell__rail {
    display: none;
    position: static;
    max-height: none;
  }
  .shell__rail--open {
    display: block;
  }
  .colophon {
    padding: 0 1rem 2rem;
  }
}
</style>
