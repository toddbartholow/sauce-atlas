<script setup lang="ts">
import SealMark from './SealMark.vue'
import type { ScoredRecipe } from '../types'

defineProps<{ entry: ScoredRecipe }>()
defineEmits<{ (e: 'select'): void }>()

const heatWords = ['no heat', 'mild', 'hot', 'punishing']
</script>

<template>
  <article class="card" :class="`card--${entry.status}`" @click="$emit('select')">
    <button class="card__hit" type="button">
      <span class="sr-only">Open {{ entry.recipe.name }}</span>
    </button>

    <div class="card__top">
      <SealMark :glyph="entry.cuisine.seal" :accent="entry.cuisine.accent" :size="40" />
      <p class="card__origin">
        {{ entry.cuisine.label }}
        <em v-if="entry.recipe.region">{{ entry.recipe.region }}</em>
      </p>
    </div>

    <h3 class="card__name">{{ entry.recipe.name }}</h3>
    <p v-if="entry.recipe.nativeName" class="card__native">{{ entry.recipe.nativeName }}</p>

    <p class="card__blurb">{{ entry.recipe.blurb }}</p>

    <ul class="card__tastes">
      <li v-for="flavor in entry.recipe.flavors" :key="flavor">
        <span class="chip" :class="`taste-${flavor.toLowerCase()}`">{{ flavor }}</span>
      </li>
    </ul>

    <footer class="card__foot">
      <span class="card__kind">{{ entry.recipe.category }}</span>
      <span class="card__dots" :title="heatWords[entry.recipe.heat]">
        <i v-for="n in 3" :key="n" :class="{ on: n <= entry.recipe.heat }"></i>
      </span>
    </footer>

    <p class="card__status">
      <template v-if="entry.status === 'ready'">Everything on hand</template>
      <template v-else-if="entry.status === 'stand-in'">
        Uses {{ entry.standIns.length }} stand-in{{ entry.standIns.length === 1 ? '' : 's' }}
      </template>
      <template v-else>
        Need {{ entry.missing.map((m) => m.label.toLowerCase()).join(', ') }}
      </template>
    </p>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, var(--surface-top), var(--surface-bottom));
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 1.05rem 1.1rem 0;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
  box-shadow: 0 1px 0 var(--surface-sheen) inset;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--gold);
  box-shadow: 0 6px 18px -10px var(--card-shadow), 0 1px 0 var(--surface-sheen-lift) inset;
}
.card:hover :deep(.seal) {
  transform: rotate(1.5deg) scale(1.04);
}
:deep(.seal) {
  transition: transform 0.2s ease;
}

.card__hit {
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.card__top {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.55rem;
}

.card__origin {
  margin: 0;
  font-family: var(--utility);
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-soft);
  line-height: 1.25;
}
.card__origin em {
  display: block;
  font-family: var(--body);
  font-style: italic;
  letter-spacing: 0;
  text-transform: none;
  font-size: 0.8rem;
  color: var(--text-faint);
}

.card__name {
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.42rem;
  line-height: 1.12;
  margin: 0;
  color: var(--text);
}

.card__native {
  margin: 0.15rem 0 0;
  font-family: var(--seal-face);
  font-size: 0.9rem;
  color: var(--accent);
}

.card__blurb {
  margin: 0.55rem 0 0.75rem;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-soft);
}

.card__tastes {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  margin: 0 0 0.85rem;
  padding: 0;
}

.card__foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--rule-soft);
}

.card__kind {
  font-family: var(--utility);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.card__dots {
  display: inline-flex;
  gap: 3px;
}
.card__dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--taste-spicy);
  opacity: 0.4;
}
.card__dots i.on {
  background: var(--taste-spicy);
  opacity: 1;
}

.card__status {
  margin: 0 -1.1rem;
  padding: 0.4rem 1.1rem;
  font-family: var(--utility);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-top: 1px solid var(--rule-soft);
  border-radius: 0 0 var(--radius) var(--radius);
}
.card--ready .card__status {
  background: var(--ready-bg);
  color: var(--ready-fg);
}
.card--stand-in .card__status {
  background: var(--sub-bg);
  color: var(--sub-fg);
}
.card--short .card__status {
  background: var(--short-bg);
  color: var(--short-fg);
}
</style>
