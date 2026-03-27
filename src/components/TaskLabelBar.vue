<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useLabels } from '../composables/useLabels'
import { useSettings } from '../composables/useSettings'
import { useI18n } from '../composables/useI18n'

const { labels, activeLabelId, addLabel, removeLabel, setActiveLabel } = useLabels()
const { accentColor, fontSize } = useSettings()
const { t } = useI18n()

const showAdd = ref(false)
const newName = ref('')
const newColor = ref('#FF8C00')
const addAreaRef = ref<HTMLElement | null>(null)

function handleAdd() {
  const name = newName.value.trim()
  if (!name) return
  addLabel(name, newColor.value)
  newName.value = ''
  newColor.value = accentColor.value
  showAdd.value = false
}

function cancelAdd() {
  newName.value = ''
  showAdd.value = false
}

function onClickOutside(e: MouseEvent) {
  if (showAdd.value && addAreaRef.value && !addAreaRef.value.contains(e.target as Node)) {
    cancelAdd()
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div class="flex items-center gap-1 flex-wrap px-1">
    <button
      v-for="l in labels"
      :key="l.id"
      class="px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 group"
      :class="activeLabelId === l.id ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
      :style="{
        fontSize: (fontSize - 1) + 'px',
        ...(activeLabelId === l.id ? { backgroundColor: l.color + 'cc' } : {}),
      }"
      @click="setActiveLabel(l.id)"
    >
      <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: l.color }" />
      {{ l.name }}
      <span
        v-if="l.id !== 'default'"
        class="inline-flex overflow-hidden max-w-0 opacity-0 group-hover:max-w-[16px] group-hover:opacity-100 transition-all duration-200 ease-out text-neutral-500 hover:text-red-400"
        @click.stop="removeLabel(l.id)"
      >&times;</span>
    </button>
    <!-- 添加按钮 -->
    <button
      v-if="!showAdd"
      class="w-5 h-5 rounded-full bg-white/5 text-neutral-500 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
      :style="{ fontSize: (fontSize - 1) + 'px' }"
      @click="showAdd = true"
    >+</button>
    <!-- 内联添加 -->
    <div v-else ref="addAreaRef" class="flex items-center gap-1">
      <label
        class="w-4 h-4 rounded-full cursor-pointer border border-white/20 overflow-hidden relative flex-shrink-0"
        :style="{ backgroundColor: newColor }"
      >
        <input
          type="color"
          v-model="newColor"
          class="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <input
        v-model="newName"
        class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white focus:outline-none"
        :style="{ fontSize: (fontSize - 1) + 'px', width: '60px' }"
        :placeholder="t.labelName"
        @keyup.enter="handleAdd"
        @keyup.escape="showAdd = false"
      />
      <button
        class="px-1.5 py-0.5 rounded text-white cursor-pointer"
        :style="{ backgroundColor: newColor, fontSize: (fontSize - 1) + 'px' }"
        @click="handleAdd"
      >OK</button>
    </div>
  </div>
</template>
