<script setup lang="ts">
import { computed } from 'vue'
import SealMark from './SealMark.vue'
import { ingredient } from '../composables/useAtlas'
import type { ScoredRecipe } from '../types'

const props = defineProps<{ entry: ScoredRecipe }>()
defineEmits<{ (e: 'close'): void }>()

const lines = computed(() =>
  props.entry.recipe.ingredients.map((line) => {
    const item = ingredient(line.id)
    const inert = item?.ignoreForMatching ?? false
    return {
      ...line,
      label: item?.label ?? line.id,
      have: inert || (item?.owned ?? false),
      inert
    }
  })
)

const heatWords = ['No heat', 'Mild', 'Hot', 'Punishing']
const sweetWords = ['Not sweet', 'Barely sweet', 'Moderately sweet', 'Sweet']
</script>

<template>
  <div class="scrim" @click.self="$emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="entry.recipe.name">
      <header class="sheet__head">
        <SealMark :glyph="entry.cuisine.seal" :accent="entry.cuisine.accent" :size="54" />
        <div class="sheet__titling">
          <p class="eyebrow sheet__origin">
            {{ entry.cuisine.label }}<template v-if="entry.recipe.region"> · {{ entry.recipe.region }}</template>
            · {{ entry.recipe.category }}
          </p>
          <h2>{{ entry.recipe.name }}</h2>
          <p v-if="entry.recipe.nativeName" class="sheet__native">{{ entry.recipe.nativeName }}</p>
        </div>
        <button class="sheet__close" @click="$emit('close')" aria-label="Close">×</button>
      </header>
      <hr class="rule-foil" />

      <div class="sheet__body">
        <p class="sheet__blurb">{{ entry.recipe.blurb }}</p>

        <ul class="sheet__tastes">
          <li v-for="flavor in entry.recipe.flavors" :key="flavor">
            <span class="chip" :class="`taste-${flavor.toLowerCase()}`">{{ flavor }}</span>
          </li>
          <li><span class="chip taste-spicy">{{ heatWords[entry.recipe.heat] }}</span></li>
          <li><span class="chip taste-sweet">{{ sweetWords[entry.recipe.sweetness] }}</span></li>
        </ul>

        <div class="cols">
          <div>
            <p class="eyebrow sheet__label">Ingredients</p>
            <ul class="ing">
              <li v-for="line in lines" :key="line.id" :class="{ 'ing--gap': !line.have && !line.sub }">
                <span class="ing__mark" :class="line.have ? 'ing__mark--have' : line.sub ? 'ing__mark--sub' : 'ing__mark--gap'" aria-hidden="true"></span>
                <span class="ing__text">
                  <strong>{{ line.label }}</strong>
                  <span class="ing__amount">{{ line.amount }}</span>
                  <em v-if="line.optional">optional</em>
                  <em v-if="line.sub" class="ing__sub">stand-in: {{ line.sub }}</em>
                </span>
              </li>
            </ul>
          </div>

          <div>
            <p class="eyebrow sheet__label">Method</p>
            <ol class="steps">
              <li v-for="(step, i) in entry.recipe.method" :key="i">{{ step }}</li>
            </ol>

            <p class="eyebrow sheet__label">Put it on</p>
            <p class="uses">{{ entry.recipe.uses.join(' · ') }}</p>

            <p v-if="entry.recipe.keeps" class="keeps">
              <span class="eyebrow">Keeps</span> {{ entry.recipe.keeps }}
            </p>
          </div>
        </div>

        <blockquote v-if="entry.recipe.note" class="note">{{ entry.recipe.note }}</blockquote>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  background: var(--scrim);
  backdrop-filter: blur(2px);
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  animation: fade 0.18s ease;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}

.sheet {
  width: min(680px, 100%);
  height: 100%;
  overflow-y: auto;
  background-color: var(--surface-sheet);
  background-image: var(--grain-fine);
  border-left: 1px solid var(--gold-deep);
  animation: slide 0.24s cubic-bezier(0.2, 0.7, 0.3, 1);
}
@keyframes slide {
  from {
    transform: translateX(3%);
    opacity: 0.4;
  }
}

.sheet__head {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.3rem 1.5rem 1.1rem;
  background: var(--band-base);
  background-image: repeating-linear-gradient(45deg, var(--band-weave) 0 1px, transparent 1px 20px);
  color: var(--band-text);
}

.sheet__titling {
  flex: 1;
  min-width: 0;
}
.sheet__origin {
  margin: 0 0 0.2rem;
  color: var(--gold-bright);
  font-size: 0.68rem;
}
.sheet__head h2 {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(1.6rem, 3.4vw, 2.2rem);
  line-height: 1.05;
  margin: 0;
}
.sheet__native {
  margin: 0.25rem 0 0;
  font-family: var(--seal-face);
  color: var(--band-quiet);
}
.sheet__close {
  font-size: 1.8rem;
  line-height: 1;
  color: var(--gold-bright);
  padding: 0 0.2rem;
}
.sheet__close:hover {
  color: var(--parchment-warm);
}

.sheet__body {
  padding: 1.3rem 1.5rem 3rem;
}

.sheet__blurb {
  margin: 0 0 0.9rem;
  font-size: 1.05rem;
  line-height: 1.6;
}

.sheet__tastes {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0 0 1.4rem;
  padding: 0;
}

.cols {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  gap: 1.8rem;
}

.sheet__label {
  color: var(--accent);
  margin: 0 0 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--rule-strong);
}
.sheet__label + * {
  margin-top: 0;
}

.ing {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ing li {
  display: flex;
  gap: 0.55rem;
  padding: 0.35rem 0;
  border-bottom: 1px dotted var(--rule-dotted);
}
.ing__mark {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 0.5rem;
  border-radius: 50%;
}
.ing__mark--have {
  background: var(--mark-have);
}
.ing__mark--sub {
  background: var(--mark-sub);
}
.ing__mark--gap {
  background: var(--mark-gap);
}
.ing__text {
  font-size: 0.94rem;
  line-height: 1.4;
}
.ing__text strong {
  font-weight: 600;
}
.ing__amount {
  display: block;
  font-family: var(--utility);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
.ing__text em {
  display: block;
  font-size: 0.8rem;
  color: var(--mark-sub);
}

.steps {
  margin: 0 0 1.6rem;
  padding-left: 1.1rem;
  font-size: 0.96rem;
}
.steps li {
  margin-bottom: 0.55rem;
  padding-left: 0.2rem;
}
.steps li::marker {
  font-family: var(--display);
  color: var(--accent);
}

.uses {
  margin: 0 0 1.6rem;
  font-family: var(--body);
  font-style: italic;
  color: var(--text-soft);
}

.keeps {
  margin: 0;
  font-size: 0.9rem;
}
.keeps .eyebrow {
  color: var(--accent);
  margin-right: 0.4rem;
}

.note {
  margin: 1.8rem 0 0;
  padding: 0.9rem 1.1rem;
  border-left: 3px solid var(--gold);
  background: var(--note-bg);
  font-style: italic;
  color: var(--text-soft);
}

@media (max-width: 640px) {
  .cols {
    grid-template-columns: 1fr;
    gap: 1.4rem;
  }
  .sheet__body,
  .sheet__head {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
