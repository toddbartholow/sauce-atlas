<script setup lang="ts">
import { computed } from 'vue'
import type { AccentName } from '../types'

const props = withDefaults(
  defineProps<{ glyph: string; accent?: AccentName; size?: number }>(),
  { accent: 'cinnabar', size: 42 }
)

/** Multi-character seals (Suka, मसाला, 麻辣) have to shrink to fit the square. */
const fontSize = computed(() => {
  const n = [...props.glyph].length
  if (n <= 1) return props.size * 0.6
  if (n === 2) return props.size * 0.42
  if (n === 3) return props.size * 0.3
  return props.size * 0.24
})
</script>

<template>
  <span
    class="seal"
    :class="`seal--${accent}`"
    :style="{
      width: size + 'px',
      height: size + 'px',
      fontSize: fontSize + 'px'
    }"
    aria-hidden="true"
    >{{ glyph }}</span
  >
</template>
