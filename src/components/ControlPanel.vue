<script setup lang="ts">
import { TimeMode, type EngineStatus } from '../composables/useTimeEngine'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'

const { t } = useI18n()
const { accentColor, fontSize, buttonSize } = useSettings()

defineProps<{
  currentMode: TimeMode
  status: EngineStatus
  customMinutes: number
}>()

const emit = defineEmits<{
  (e: 'update:currentMode', mode: TimeMode): void
  (e: 'update:customMinutes', val: number): void
  (e: 'start'): void
  (e: 'pause'): void
  (e: 'reset'): void
}>()

const modeKeys: { key: 'modeDay' | 'modeWeek' | 'modeMonth' | 'modeYear' | 'modeCustom'; value: TimeMode }[] = [
  { key: 'modeDay', value: TimeMode.DAY },
  { key: 'modeWeek', value: TimeMode.WEEK },
  { key: 'modeMonth', value: TimeMode.MONTH },
  { key: 'modeYear', value: TimeMode.YEAR },
  { key: 'modeCustom', value: TimeMode.CUSTOM },
]

function onMinutesInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!isNaN(val) && val > 0 && val <= 480) {
    emit('update:customMinutes', val)
  }
}
</script>

<template>
  <!-- 模式切换 -->
  <div class="flex gap-1 justify-center flex-wrap">
    <button
      v-for="m in modeKeys"
      :key="m.value"
      class="rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center"
      :class="currentMode === m.value
        ? 'text-white font-bold'
        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'"
      :style="{
        fontSize: fontSize + 'px',
        height: buttonSize + 'px',
        padding: '0 ' + Math.round(buttonSize * 0.4) + 'px',
        ...(currentMode === m.value
          ? { backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}66` }
          : {})
      }"
      @click="emit('update:currentMode', m.value)"
    >
      {{ t[m.key] }}
    </button>
  </div>

  <!-- 番茄钟控制 -->
  <div
    v-if="currentMode === 'CUSTOM'"
    class="flex items-center justify-center gap-2 mt-2"
  >
    <input
      type="number"
      :value="customMinutes"
      min="1"
      max="480"
      class="w-16 bg-white/5 text-center rounded px-2 py-1
             border border-white/10 focus:outline-none"
      :style="{ fontSize: (fontSize + 1) + 'px', color: accentColor, borderColor: status === 'running' ? 'transparent' : accentColor + '66' }"
      :disabled="status === 'running'"
      @input="onMinutesInput"
    />
    <span class="text-neutral-500" :style="{ fontSize: fontSize + 'px' }">{{ t.minutes }}</span>

    <button
      v-if="status !== 'running'"
      class="rounded text-white hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
      :style="{ backgroundColor: '#34d399', fontSize: fontSize + 'px', height: buttonSize + 'px', padding: '0 ' + Math.round(buttonSize * 0.5) + 'px' }"
      @click="emit('start')"
    >
      {{ status === 'paused' ? t.resume : t.start }}
    </button>
    <button
      v-else
      class="rounded text-white hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
      :style="{ backgroundColor: accentColor, fontSize: fontSize + 'px', height: buttonSize + 'px', padding: '0 ' + Math.round(buttonSize * 0.5) + 'px' }"
      @click="emit('pause')"
    >
      {{ t.pause }}
    </button>
    <button
      class="rounded bg-white/10 text-neutral-300 hover:bg-white/15
             transition-colors cursor-pointer flex items-center justify-center"
      :style="{ fontSize: fontSize + 'px', height: buttonSize + 'px', padding: '0 ' + Math.round(buttonSize * 0.5) + 'px' }"
      @click="emit('reset')"
    >
      {{ t.reset }}
    </button>
  </div>
</template>
