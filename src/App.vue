<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useTimeEngine, TimeMode } from './composables/useTimeEngine'
import { useI18n, loadLocale } from './composables/useI18n'
import { useSettings, loadSettings } from './composables/useSettings'
import { useStats, loadStats } from './composables/useStats'
import { useLabels, loadLabels } from './composables/useLabels'
import TitleBar from './components/TitleBar.vue'
import ControlPanel from './components/ControlPanel.vue'
import MatrixRenderer from './components/MatrixRenderer.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import TaskLabelBar from './components/TaskLabelBar.vue'

// ── i18n & settings ──────────────────────────────
const { t } = useI18n()
const { accentColor, fontSize, buttonSize, windowOpacity, bgColor, densityScale } = useSettings()
const { recordPomodoro } = useStats()
const { activeLabel } = useLabels()

// ── 状态 ──────────────────────────────────────────
const currentMode = ref<TimeMode>(TimeMode.DAY)
const customMinutes = ref(25)
const customDurationSec = computed(() => customMinutes.value * 60)
const showSettings = ref(false)
const showStats = ref(false)
const locked = ref(false)
const alwaysOnTop = ref(true)

// ── 沉浸模式：番茄钟运行时隐藏 UI，只留点阵 ──
const immersive = computed(() => currentMode.value === TimeMode.CUSTOM && status.value === 'running')

// ── 番茄钟完成回调 ──────────────────────────────
async function onPomodoroComplete() {
  // 记录统计
  await recordPomodoro(activeLabel.value.name, customMinutes.value, true, activeLabel.value.color)
  // 桌面通知
  try {
    const { sendNotification } = await import('@tauri-apps/plugin-notification')
    sendNotification({ title: t.value.pomodoroComplete, body: t.value.pomodoroCompleteBody })
  } catch { /* notification not available */ }
}

const {
  totalDots,
  passedDots,
  progressPercentage,
  remainingText,
  status,
  start,
  pause,
  reset,
} = useTimeEngine({
  mode: currentMode,
  customDurationSec,
  densityScale,
  onComplete: onPomodoroComplete,
})

// ── 模式标签映射 ──────────────────────────────────
const modeLabelKey: Record<TimeMode, 'labelDay' | 'labelWeek' | 'labelMonth' | 'labelYear' | 'labelCustom'> = {
  [TimeMode.DAY]: 'labelDay',
  [TimeMode.WEEK]: 'labelWeek',
  [TimeMode.MONTH]: 'labelMonth',
  [TimeMode.YEAR]: 'labelYear',
  [TimeMode.CUSTOM]: 'labelCustom',
}

// ── 根样式计算 ─────────────────────────────────────
const rootStyle = computed(() => ({
  background: `${bgColor.value}${Math.round(windowOpacity.value * 2.55).toString(16).padStart(2, '0')}`,
  fontSize: fontSize.value + 'px',
  '--btn-size': buttonSize.value + 'px',
}))

// ── Tauri 窗口操作 ────────────────────────────────
const appWindow = getCurrentWindow()

async function handleClose() {
  await appWindow.close()
}

function handleToggleLock() {
  locked.value = !locked.value
}

async function handleToggleAlwaysOnTop() {
  alwaysOnTop.value = !alwaysOnTop.value
  await appWindow.setAlwaysOnTop(alwaysOnTop.value)
}

// ── 初始化持久化数据 ──────────────────────────────
onMounted(async () => {
  await Promise.all([loadSettings(), loadStats(), loadLabels(), loadLocale()])
})
</script>

<template>
  <div
    class="relative w-full h-screen flex flex-col text-white overflow-hidden rounded-xl
           border border-white/10"
    :style="rootStyle"
  >
    <!-- 标题栏 -->
    <TitleBar
      :locked="locked"
      :always-on-top="alwaysOnTop"
      @close="handleClose"
      @toggle-lock="handleToggleLock"
      @toggle-always-on-top="handleToggleAlwaysOnTop"
      @open-settings="showSettings = true"
      @open-stats="showStats = true"
    />

    <!-- 控制面板 -->
    <div v-show="!immersive" class="px-3 py-2">
      <ControlPanel
        :current-mode="currentMode"
        :status="status"
        :custom-minutes="customMinutes"
        @update:current-mode="currentMode = $event"
        @update:custom-minutes="customMinutes = $event"
        @start="start"
        @pause="pause"
        @reset="reset"
      />
    </div>

    <!-- 任务标签栏（仅番茄钟模式显示） -->
    <div v-if="currentMode === 'CUSTOM'" v-show="!immersive" class="px-3 pb-1">
      <TaskLabelBar />
    </div>

    <!-- 进度信息 -->
    <div v-show="!immersive" class="px-3 pb-1 flex items-center justify-between text-neutral-400"
         :style="{ fontSize: (fontSize - 1) + 'px' }">
      <span>{{ t[modeLabelKey[currentMode]] }} · {{ passedDots }}/{{ totalDots }}</span>
      <span class="tabular-nums font-mono" :style="{ color: accentColor + 'cc' }">{{ progressPercentage }}%</span>
    </div>

    <!-- 点阵区域 -->
    <div class="flex-1 px-3 pb-2 overflow-hidden min-h-0"
         :class="{ 'cursor-pointer': immersive }"
         @click="immersive && pause()">
      <div class="w-full h-full overflow-y-auto">
        <MatrixRenderer :total-dots="totalDots" :passed-dots="passedDots" />
      </div>
      <!-- 沉浸模式底部剩余时间叠加 -->
      <div v-if="immersive"
           class="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <span class="font-mono tabular-nums opacity-40" :style="{ color: accentColor, fontSize: (fontSize + 2) + 'px' }">{{ remainingText }}</span>
      </div>
    </div>

    <!-- 底部剩余时间 -->
    <div v-show="!immersive" class="px-3 py-1.5 text-center border-t border-white/10">
      <span class="text-neutral-500" :style="{ fontSize: fontSize + 'px' }">{{ t.remaining }} </span>
      <span class="font-mono tabular-nums" :style="{ color: accentColor, fontSize: (fontSize + 2) + 'px' }">{{ remainingText }}</span>
    </div>

    <!-- 设置面板（覆盖层） -->
    <SettingsPanel :visible="showSettings" @close="showSettings = false" />
    <!-- 统计面板（覆盖层） -->
    <StatsPanel :visible="showStats" @close="showStats = false" />
  </div>
</template>