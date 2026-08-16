<script setup lang="ts">
import SealMark from './SealMark.vue'
import { cuisines, theme, toggleTheme } from '../composables/useAtlas'
</script>

<template>
  <header class="band">
    <div class="band__inner">
      <div class="mark">
        <SealMark glyph="醬" accent="cinnabar" :size="66" />
      </div>

      <div class="titling">
        <p class="eyebrow band__eyebrow">A pantry-first index</p>
        <h1 class="band__title">Sauce Atlas</h1>
        <p class="band__glyphs">
          <span v-for="c in cuisines" :key="c.id">{{ c.seal }}</span>
        </p>
      </div>

      <button
        class="band__palette"
        type="button"
        @click="toggleTheme"
        :aria-label="theme === 'dark' ? 'Switch to the daylight palette' : 'Switch to the lamplight palette'"
      >
        <span class="band__palette-glyph" aria-hidden="true">{{ theme === 'dark' ? '日' : '夜' }}</span>
        <span>{{ theme === 'dark' ? 'Daylight' : 'Lamplight' }}</span>
      </button>
    </div>
    <hr class="rule-foil" />
  </header>
</template>

<style scoped>
.band {
  background-color: var(--band-base);
  background-image:
    repeating-linear-gradient(45deg, var(--band-weave) 0 1px, transparent 1px 22px),
    repeating-linear-gradient(-45deg, var(--band-weave) 0 1px, transparent 1px 22px),
    radial-gradient(ellipse at 20% 0%, var(--band-glow), transparent 60%);
  color: var(--band-text);
  border-bottom: 1px solid var(--gold-deep);
}

.band__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 1.5rem 1.75rem 1.6rem;
  display: flex;
  align-items: center;
  gap: 1.4rem;
}

.mark {
  flex: none;
}

.titling {
  flex: 1;
  min-width: 0;
}

.band__eyebrow {
  margin: 0 0 0.15rem;
  color: var(--gold-bright);
}

.band__title {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2rem, 4.4vw, 3.1rem);
  line-height: 0.95;
  margin: 0;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
}

.band__glyphs {
  margin: 0.5rem 0 0;
  font-family: var(--seal-face);
  font-size: 0.95rem;
  letter-spacing: 0.5em;
  color: var(--band-dim);
}

/* Gold hairline and small caps only. The seal stays the one ornament here. */
.band__palette {
  flex: none;
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  padding: 0.42rem 0.8rem 0.34rem;
  border: 1px solid var(--gold-deep);
  border-radius: 1px;
  font-family: var(--utility);
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold-bright);
  transition: border-color 0.15s ease, color 0.15s ease;
}
.band__palette:hover {
  border-color: var(--gold-bright);
  color: var(--parchment-warm);
}

.band__palette-glyph {
  font-family: var(--seal-face);
  font-size: 0.9rem;
  letter-spacing: 0;
}

@media (max-width: 720px) {
  .band__inner {
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1.1rem 1rem 1.2rem;
  }
  .band__glyphs {
    display: none;
  }
}
</style>
