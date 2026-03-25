<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'
import { useStats } from '../composables/useStats'

const { t } = useI18n()
const { accentColor } = useSettings()
const { today, last7Days, totalFocusMinutes, totalPomodoros } = useStats()

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const maxMinutes = computed(() => {
  const vals = last7Days.value.map(d => d.focusMinutes)
  return Math.max(...vals, 1)
})
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="absolute inset-0 z-50 flex flex-col bg-[#2a2a2a]/95 backdrop-blur-sm rounded-xl overflow-hidden"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span class="text-sm font-bold text-neutral-200">{{ t.statistics }}</span>
        <button
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors cursor-pointer"
          @click="emit('close')"
        >
          <svg class="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <!-- 汇总卡片 -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <div class="text-[10px] text-neutral-500">{{ t.todayFocus }}</div>
            <div class="text-lg font-mono tabular-nums" :style="{ color: accentColor }">
              {{ today.focusMinutes }}<span class="text-[10px] text-neutral-500 ml-0.5">{{ t.min }}</span>
            </div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <div class="text-[10px] text-neutral-500">{{ t.todayPomodoros }}</div>
            <div class="text-lg font-mono tabular-nums" :style="{ color: accentColor }">
              {{ today.completedPomodoros }}
            </div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <div class="text-[10px] text-neutral-500">{{ t.totalFocus }}</div>
            <div class="text-lg font-mono tabular-nums text-neutral-300">
              {{ totalFocusMinutes }}<span class="text-[10px] text-neutral-500 ml-0.5">{{ t.min }}</span>
            </div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <div class="text-[10px] text-neutral-500">{{ t.totalPomodoros }}</div>
            <div class="text-lg font-mono tabular-nums text-neutral-300">
              {{ totalPomodoros }}
            </div>
          </div>
        </div>

        <!-- 7日柱状图 -->
        <div>
          <div class="text-xs text-neutral-400 mb-2">{{ t.last7Days }}</div>
          <div class="flex items-end gap-1.5 h-24 px-1">
            <div
              v-for="day in last7Days"
              :key="day.date"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div
                class="w-full rounded-t transition-all duration-500"
                :style="{
                  height: Math.max(4, (day.focusMinutes / maxMinutes) * 80) + 'px',
                  backgroundColor: day.focusMinutes > 0 ? accentColor : '#555',
                  opacity: day.focusMinutes > 0 ? 1 : 0.3,
                }"
              />
              <span class="text-[8px] text-neutral-500 tabular-nums">
                {{ day.date.slice(5) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 今日记录 -->
        <div v-if="today.records.length > 0">
          <div class="text-xs text-neutral-400 mb-2">{{ t.todayFocus }}</div>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="(rec, i) in today.records"
              :key="i"
              class="flex items-center gap-2 text-[10px] px-2 py-1 rounded bg-white/5"
            >
              <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: rec.completed ? (rec.labelColor || accentColor) : '#555' }" />
              <span class="text-neutral-300 flex-1 truncate">{{ rec.label }}</span>
              <span class="text-neutral-500 tabular-nums font-mono">{{ rec.durationMin }}{{ t.min }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
