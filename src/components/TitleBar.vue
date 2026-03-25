<script setup lang="ts">
import { computed } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'

const { t } = useI18n()
const { accentColor, buttonSize, fontSize } = useSettings()

const iconSize = computed(() => Math.round(buttonSize.value * 0.58) + 'px')

defineProps<{ locked: boolean; alwaysOnTop: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggleLock'): void
  (e: 'toggleAlwaysOnTop'): void
  (e: 'openSettings'): void
  (e: 'openStats'): void
}>()

async function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  await getCurrentWindow().startDragging()
}
</script>

<template>
  <div
    class="flex items-center justify-between px-3 py-1.5 select-none"
    :class="locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'"
    @mousedown="!locked && startDrag($event)"
  >
    <!-- 标题区 -->
    <span
      class="font-bold tracking-widest pointer-events-none"
      :style="{ color: accentColor, fontSize: fontSize + 'px' }"
    >
      ● {{ t.appName }}
    </span>

    <!-- 按钮区 -->
    <div class="flex items-center gap-1">
      <!-- 设置 -->
      <button
        class="flex items-center justify-center rounded
               text-neutral-500 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
        :style="{ width: buttonSize + 'px', height: buttonSize + 'px' }"
        :title="t.settingsTooltip"
        @click.stop="emit('openSettings')"
      >
        <svg :style="{ width: iconSize, height: iconSize }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <!-- 统计 -->
      <button
        class="flex items-center justify-center rounded
               text-neutral-500 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
        :style="{ width: buttonSize + 'px', height: buttonSize + 'px' }"
        :title="t.statsTooltip"
        @click.stop="emit('openStats')"
      >
        <svg :style="{ width: iconSize, height: iconSize }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="12" width="4" height="9" rx="1" />
          <rect x="10" y="7" width="4" height="14" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      </button>
      <!-- 锁定位置 -->
      <button
        class="flex items-center justify-center rounded transition-colors cursor-pointer"
        :class="locked ? 'bg-white/10' : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/10'"
        :style="{ width: buttonSize + 'px', height: buttonSize + 'px', ...(locked ? { color: accentColor } : {}) }"
        :title="locked ? t.unlockTooltip : t.lockTooltip"
        @click.stop="emit('toggleLock')"
      >
        <!-- Lock / Unlock icon -->
        <svg v-if="locked" :style="{ width: iconSize, height: iconSize }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <svg v-else :style="{ width: iconSize, height: iconSize }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
      </button>
      <!-- 置顶 -->
      <button
        class="flex items-center justify-center rounded transition-colors cursor-pointer"
        :class="alwaysOnTop ? 'bg-white/10' : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/10'"
        :style="{ width: buttonSize + 'px', height: buttonSize + 'px', ...(alwaysOnTop ? { color: accentColor } : {}) }"
        :title="alwaysOnTop ? t.unpinTooltip : t.pinTooltip"
        @click.stop="emit('toggleAlwaysOnTop')"
      >
        <!-- Arrow-up-to-line icon (always on top) -->
        <svg :style="{ width: iconSize, height: iconSize }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 3h14" />
          <path d="M12 7v14" />
          <path d="M8 11l4-4 4 4" />
        </svg>
      </button>
      <!-- 关闭 -->
      <button
        class="flex items-center justify-center rounded
               text-neutral-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
        :style="{ width: buttonSize + 'px', height: buttonSize + 'px' }"
        :title="t.closeTooltip"
        @click.stop="emit('close')"
      >
        <svg :style="{ width: iconSize, height: iconSize }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
