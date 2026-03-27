<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'
import { useStats } from '../composables/useStats'
import type { DailyStats, PomodoroRecord } from '../composables/useStats'

const { t } = useI18n()
const { accentColor } = useSettings()
const { today, last7Days, totalFocusMinutes, totalPomodoros } = useStats()

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const selectedDayIndex = ref<number | null>(null)

const selectedDay = computed<DailyStats | null>(() => {
  if (selectedDayIndex.value === null) return null
  return last7Days.value[selectedDayIndex.value] ?? null
})

const maxMinutes = computed(() => {
  const vals = last7Days.value.map(d => d.focusMinutes)
  return Math.max(...vals, 1)
})

// ── 时间轴图表 ──

/** 当前展示的日期记录（选中日 or 今日） */
const displayDay = computed<DailyStats | null>(() => {
  return selectedDay.value ?? (today.value.records.length > 0 ? today.value : null)
})

/** 将记录映射为时间轴柱子 */
interface TimelineBar {
  rec: PomodoroRecord
  idx: number
  startHour: number   // 小数 e.g. 14.5
  endHour: number
  label: string
  color: string
}

const timelineBars = computed<TimelineBar[]>(() => {
  const day = displayDay.value
  if (!day || day.records.length === 0) return []
  return day.records.map((rec, idx) => {
    const s = new Date(rec.startTime)
    const startHour = s.getHours() + s.getMinutes() / 60
    const endHour = startHour + rec.durationMin / 60
    return {
      rec, idx,
      startHour,
      endHour: Math.min(endHour, 24),
      label: rec.label,
      color: rec.completed ? (rec.labelColor || accentColor.value) : '#555',
    }
  })
})

/** 计算时间轴显示范围：只显示有数据的小时区间±1 */
const timeRange = computed(() => {
  const bars = timelineBars.value
  if (bars.length === 0) return { start: 8, end: 20 }
  const minH = Math.floor(Math.min(...bars.map(b => b.startHour)))
  const maxH = Math.ceil(Math.max(...bars.map(b => b.endHour)))
  return { start: Math.max(0, minH - 1), end: Math.min(24, maxH + 1) }
})

const hourLabels = computed(() => {
  const arr: number[] = []
  for (let h = timeRange.value.start; h <= timeRange.value.end; h++) arr.push(h)
  return arr
})

/** 悬停高亮：按记录索引联动 */
const hoveredIdx = ref<number | null>(null)

function barStyle(bar: TimelineBar) {
  const range = timeRange.value.end - timeRange.value.start
  const left = ((bar.startHour - timeRange.value.start) / range) * 100
  const width = ((bar.endHour - bar.startHour) / range) * 100
  const dimmed = hoveredIdx.value !== null && hoveredIdx.value !== bar.idx
  return {
    left: left + '%',
    width: Math.max(width, 0.8) + '%',
    backgroundColor: bar.color,
    opacity: dimmed ? 0.2 : 1,
    boxShadow: hoveredIdx.value === bar.idx ? `0 0 6px ${bar.color}aa` : 'none',
  }
}

/** 格式化时段文字 */
function formatPeriod(startTime: number, durationMin: number): string {
  const s = new Date(startTime)
  const e = new Date(startTime + durationMin * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(s.getHours())}:${pad(s.getMinutes())} – ${pad(e.getHours())}:${pad(e.getMinutes())}`
}
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
              v-for="(day, idx) in last7Days"
              :key="day.date"
              class="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              @click="selectedDayIndex = selectedDayIndex === idx ? null : idx"
            >
              <div
                class="w-full rounded-t transition-all duration-300"
                :style="{
                  height: Math.max(4, (day.focusMinutes / maxMinutes) * 80) + 'px',
                  backgroundColor: day.focusMinutes > 0 ? accentColor : '#555',
                  opacity: selectedDayIndex !== null && selectedDayIndex !== idx ? 0.25 : (day.focusMinutes > 0 ? 1 : 0.3),
                  boxShadow: selectedDayIndex === idx ? `0 0 8px ${accentColor}88` : 'none',
                }"
              />
              <span class="text-[8px] tabular-nums transition-colors duration-200"
                :class="selectedDayIndex === idx ? 'text-neutral-200' : 'text-neutral-500'"
              >
                {{ day.date.slice(5) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 时间轴详情 -->
        <Transition name="detail" mode="out-in">
          <div v-if="displayDay" :key="displayDay.date">
            <div class="text-xs text-neutral-400 mb-2 flex items-center justify-between">
              <span>{{ displayDay.date }} · {{ t.dayDetail }}</span>
              <span class="font-mono tabular-nums text-[10px]" :style="{ color: accentColor }">{{ displayDay.focusMinutes }}{{ t.min }}</span>
            </div>

            <!-- 时间轴柱状图 -->
            <div v-if="timelineBars.length > 0"
                 class="relative bg-white/5 rounded-lg px-2 pt-3 pb-1"
                 @mouseleave="hoveredIdx = null">
              <!-- 柱子区域 -->
              <div class="relative h-6">
                <div
                  v-for="bar in timelineBars"
                  :key="bar.idx"
                  class="absolute top-0 h-full rounded-sm cursor-pointer transition-all duration-200"
                  :style="barStyle(bar)"
                  @mouseenter="hoveredIdx = bar.idx"
                  @mouseleave="hoveredIdx = null"
                >
                  <!-- tooltip -->
                  <div class="opacity-0 hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2
                              bg-black/80 text-[9px] text-neutral-200 px-1.5 py-0.5 rounded whitespace-nowrap
                              pointer-events-none z-10 transition-opacity duration-150">
                    {{ bar.label }} · {{ formatPeriod(bar.rec.startTime, bar.rec.durationMin) }}
                  </div>
                </div>
              </div>
              <!-- 时间刻度 -->
              <div class="relative h-3 mt-1 border-t border-white/10">
                <span
                  v-for="h in hourLabels"
                  :key="h"
                  class="absolute text-[7px] text-neutral-500 tabular-nums -translate-x-1/2 top-0.5"
                  :style="{ left: ((h - timeRange.start) / (timeRange.end - timeRange.start)) * 100 + '%' }"
                >{{ h }}</span>
              </div>
            </div>

            <!-- 图例 / 记录列表 -->
            <div v-if="timelineBars.length > 0" class="mt-2 space-y-0.5">
              <div
                v-for="bar in timelineBars"
                :key="bar.idx"
                class="flex items-center gap-2 text-[10px] px-2 py-0.5 rounded transition-all duration-200 cursor-default"
                :style="{
                  backgroundColor: hoveredIdx === bar.idx ? 'rgba(255,255,255,0.08)' : 'transparent',
                  opacity: hoveredIdx !== null && hoveredIdx !== bar.idx ? 0.35 : 1,
                }"
                @mouseenter="hoveredIdx = bar.idx"
                @mouseleave="hoveredIdx = null"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: bar.color }" />
                <span class="text-neutral-300 flex-1 truncate">{{ bar.label }}</span>
                <span class="text-neutral-500 tabular-nums font-mono whitespace-nowrap">{{ formatPeriod(bar.rec.startTime, bar.rec.durationMin) }}</span>
                <span class="text-neutral-500 tabular-nums font-mono whitespace-nowrap">{{ bar.rec.durationMin }}{{ t.min }}</span>
              </div>
            </div>

            <div v-else class="text-[10px] text-neutral-500 text-center py-2">{{ t.noRecords }}</div>
          </div>
        </Transition>
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
.detail-enter-active,
.detail-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.detail-enter-from,
.detail-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
