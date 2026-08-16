<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'

const props = defineProps<{
  id: string
  label: string
  /** Active filters inside; drawn in the accent when non-zero. */
  count?: number
  /** A neutral tally like "36/56". Never clearable, shown faint. */
  tally?: string
  /** Read aloud instead of the visual meta; supplies the units digits lack. */
  spoken?: string
  /** One line of what the folded section holds. */
  summary?: string
}>()

const open = defineModel<boolean>({ required: true })
const head = ref<HTMLButtonElement | null>(null)
const slots = useSlots()

const spokenMeta = computed(() => {
  if (props.spoken) return `, ${props.spoken}`
  if (props.count) return `, ${props.count} filter${props.count === 1 ? '' : 's'} active`
  return ''
})

const hasSummary = computed(() => Boolean(props.summary) || Boolean(slots.summary))

/** Escape inside the fold closes it and hands focus back to the header. */
function onEsc() {
  open.value = false
  head.value?.focus()
}
</script>

<template>
  <section class="block" :class="{ 'block--open': open }">
    <h2 class="block__title">
      <button
        ref="head"
        :id="`sec-${id}`"
        class="block__head"
        type="button"
        :aria-expanded="open"
        :aria-controls="`sec-${id}-panel`"
        @click="open = !open"
      >
        <span class="block__row">
          <span class="eyebrow">{{ label }}</span>
          <span class="block__meta">
            <span v-if="count" class="block__count" aria-hidden="true">{{ count }}</span>
            <span v-else-if="tally" class="block__tally" aria-hidden="true">{{ tally }}</span>
            <span class="block__mark" aria-hidden="true"></span>
          </span>
        </span>
        <span class="sr-only">{{ spokenMeta }}</span>
        <span v-if="!open && hasSummary" class="block__summary" aria-hidden="true">
          <slot name="summary">{{ summary }}</slot>
        </span>
      </button>
    </h2>

    <Transition name="fold">
      <div
        v-show="open"
        :id="`sec-${id}-panel`"
        class="block__panel"
        role="group"
        :aria-labelledby="`sec-${id}`"
        @keydown.esc.stop="onEsc"
      >
        <div class="block__clip">
          <div class="block__body"><slot /></div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
/* Rule weight carries the state: soft shut, strong open. */
.block {
  border-top: 1px solid var(--rule-soft);
}
.block--open {
  border-top-color: var(--rule-strong);
}
.block:last-of-type {
  border-bottom: 1px solid var(--rule-soft);
}

.block__title {
  margin: 0;
  font: inherit;
}

.block__head {
  width: 100%;
  display: grid;
  gap: 0.1rem;
  padding: 0.7rem 0.1rem;
  color: var(--accent);
  text-align: left;
  font-family: var(--utility);
}
.block__head:hover {
  color: var(--accent-hot);
}

.block__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.block__meta {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}
.block__count {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.block__tally {
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

/* Open and closed drawn with the two hairlines we are allowed:
   a plus whose vertical stroke retracts, leaving a minus. */
.block__mark {
  width: 9px;
  height: 9px;
  flex: none;
  background:
    linear-gradient(currentColor, currentColor) center / 100% 1px no-repeat,
    linear-gradient(currentColor, currentColor) center / 1px 100% no-repeat;
  transition: background-size 0.18s ease;
}
.block--open .block__mark {
  background-size: 100% 1px, 1px 0;
}

.block__summary {
  font-family: var(--body);
  font-style: italic;
  font-size: 0.8rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.block__panel {
  display: grid;
  grid-template-rows: 1fr;
}
.fold-enter-active,
.fold-leave-active {
  transition: grid-template-rows 0.22s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.fold-enter-from,
.fold-leave-to {
  grid-template-rows: 0fr;
}

.block__clip {
  overflow: hidden;
  min-height: 0;
}
/* 3px inline gutter keeps focus rings clear of the clip. */
.block__body {
  padding: 0 3px 1rem;
  margin: 0 -3px;
}
</style>
