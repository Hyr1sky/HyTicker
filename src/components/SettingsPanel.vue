<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n, type Locale } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'

const { t, locale, setLocale } = useI18n()
const {
  accentColor, dotRoundness, dotBorderRadius, fontSize, buttonSize,
  windowOpacity, bgColor, dotDensity, dotSize, dotAnimation, dotPlayEffect,
  setAccentColor, setDotRoundness, setFontSize, setButtonSize,
  setWindowOpacity, setBgColor, setDotDensity, setDotSize, setDotAnimation, setDotPlayEffect,
} = useSettings()

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const presetColors = ['#FF8C00', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#facc15']

/* ── 圆形色盘（懒加载） ── */
const wheelRef = ref<HTMLCanvasElement | null>(null)
const showWheel = ref(false)
const wheelSize = 140
const wheelRadius = wheelSize / 2

function drawWheel(ctx: CanvasRenderingContext2D) {
  const cx = wheelRadius
  const cy = wheelRadius
  const r = wheelRadius - 4
  for (let angle = 0; angle < 360; angle++) {
    const startAngle = (angle - 1) * Math.PI / 180
    const endAngle = (angle + 1) * Math.PI / 180
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = `hsl(${angle}, 100%, 50%)`
    ctx.fill()
  }
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.5, 'rgba(255,255,255,0.3)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function initWheel() {
  const canvas = wheelRef.value
  if (!canvas) return
  canvas.width = wheelSize * 2
  canvas.height = wheelSize * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)
  drawWheel(ctx)
}

watch(showWheel, async (val) => {
  if (val) {
    await nextTick()
    initWheel()
  }
})

function pickColor(e: MouseEvent) {
  const canvas = wheelRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const ctx = canvas.getContext('2d')!
  const pixel = ctx.getImageData(x * (canvas.width / rect.width), y * (canvas.height / rect.height), 1, 1).data
  if (pixel[3] === 0) return
  const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')
  setAccentColor(hex)
}

let dragging = false
function onWheelDown(e: MouseEvent) {
  dragging = true
  pickColor(e)
}
function onWheelMove(e: MouseEvent) {
  if (dragging) pickColor(e)
}
function onWheelUp() {
  if (dragging) {
    dragging = false
    showWheel.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousemove', onWheelMove)
  document.addEventListener('mouseup', onWheelUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onWheelMove)
  document.removeEventListener('mouseup', onWheelUp)
})

/* ── slider helpers ── */
function onRoundnessInput(e: Event) {
  setDotRoundness(parseInt((e.target as HTMLInputElement).value, 10))
}
function onFontSizeInput(e: Event) {
  setFontSize(parseInt((e.target as HTMLInputElement).value, 10))
}
function onButtonSizeInput(e: Event) {
  setButtonSize(parseInt((e.target as HTMLInputElement).value, 10))
}
function onOpacityInput(e: Event) {
  setWindowOpacity(parseInt((e.target as HTMLInputElement).value, 10))
}
function onDensityInput(e: Event) {
  setDotDensity(parseInt((e.target as HTMLInputElement).value, 10))
}
function onDotSizeInput(e: Event) {
  setDotSize(parseInt((e.target as HTMLInputElement).value, 10))
}

const bgPresetColors = ['#4B4B4B', '#1a1a2e', '#2d2d2d', '#1e3a5f', '#3b1f2b', '#2e4a3e']
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="absolute inset-0 z-50 flex flex-col backdrop-blur-sm rounded-xl overflow-hidden border border-white/5"
      :style="{ backgroundColor: 'rgba(30,30,30,0.95)' }"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span class="text-sm font-bold" :style="{ color: accentColor }">{{ t.settings }}</span>
        <button
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors cursor-pointer"
          @click="emit('close')"
        >
          <svg class="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        <!-- 主题色 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.themeColor }}</label>
          <div class="flex items-center gap-1.5 flex-wrap">
            <!-- 预设色 -->
            <button
              v-for="c in presetColors"
              :key="c"
              class="w-5 h-5 rounded-full transition-all cursor-pointer"
              :class="accentColor === c ? 'ring-2 ring-white scale-110' : 'ring-0 hover:scale-105'"
              :style="{ backgroundColor: c }"
              @click="setAccentColor(c)"
            />
            <!-- 自定义色盘触发按钮 -->
            <button
              class="w-5 h-5 rounded-full transition-all cursor-pointer overflow-hidden"
              :class="showWheel ? 'ring-2 ring-white scale-110' : 'ring-0 hover:scale-105'"
              style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); background-size: 150% 150%; background-position: center"
              @click="showWheel = !showWheel"
            />
            <!-- 当前色 + hex -->
            <div
              class="w-5 h-5 rounded-full border border-white/20 ml-1"
              :style="{ backgroundColor: accentColor }"
            />
            <span class="text-[10px] text-neutral-400 font-mono uppercase">{{ accentColor }}</span>
          </div>
          <!-- 展开的圆形色盘 -->
          <Transition name="wheel">
            <div v-if="showWheel" class="mt-3 flex justify-center">
              <canvas
                ref="wheelRef"
                :width="wheelSize"
                :height="wheelSize"
                class="rounded-full cursor-crosshair"
                :style="{ width: wheelSize + 'px', height: wheelSize + 'px' }"
                @mousedown.stop="onWheelDown"
              />
            </div>
          </Transition>
        </div>

        <!-- 圆点形状 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.dotRadius }}</label>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-500">{{ t.square }}</span>
            <input
              type="range"
              min="0"
              max="50"
              :value="dotRoundness"
              class="flex-1 h-1 accent-neutral-500 cursor-pointer"
              @input="onRoundnessInput"
            />
            <span class="text-[10px] text-neutral-500">{{ t.circle }}</span>
            <div
              class="w-4 h-4 ml-1"
              :style="{ backgroundColor: accentColor, borderRadius: `${dotRoundness}%` }"
            />
          </div>
        </div>

        <!-- 字体大小 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.fontSize }}</label>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-500">A</span>
            <input
              type="range"
              min="10"
              max="18"
              :value="fontSize"
              class="flex-1 h-1 accent-neutral-500 cursor-pointer"
              @input="onFontSizeInput"
            />
            <span class="text-[10px] text-neutral-500 font-bold">A</span>
            <span class="text-[10px] text-neutral-400 font-mono w-6 text-right">{{ fontSize }}</span>
          </div>
        </div>

        <!-- 按钮大小 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.buttonSize }}</label>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-500">S</span>
            <input
              type="range"
              min="18"
              max="32"
              :value="buttonSize"
              class="flex-1 h-1 accent-neutral-500 cursor-pointer"
              @input="onButtonSizeInput"
            />
            <span class="text-[10px] text-neutral-500 font-bold">L</span>
            <span class="text-[10px] text-neutral-400 font-mono w-6 text-right">{{ buttonSize }}</span>
          </div>
        </div>

        <!-- 窗口透明度 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.windowOpacity }}</label>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-500">20</span>
            <input
              type="range"
              min="20"
              max="100"
              :value="windowOpacity"
              class="flex-1 h-1 accent-neutral-500 cursor-pointer"
              @input="onOpacityInput"
            />
            <span class="text-[10px] text-neutral-500">100</span>
            <span class="text-[10px] text-neutral-400 font-mono w-6 text-right">{{ windowOpacity }}</span>
          </div>
        </div>

        <!-- 背景颜色 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.bgColor }}</label>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="c in bgPresetColors"
              :key="c"
              class="w-5 h-5 rounded transition-all cursor-pointer border border-white/10"
              :class="bgColor === c ? 'ring-2 ring-white scale-110' : 'ring-0 hover:scale-105'"
              :style="{ backgroundColor: c }"
              @click="setBgColor(c)"
            />
            <!-- 自定义颜色 -->
            <label
              class="w-5 h-5 rounded border border-white/10 cursor-pointer hover:scale-105 transition-transform overflow-hidden relative"
              :style="{ backgroundColor: bgColor }"
            >
              <input
                type="color"
                :value="bgColor"
                class="absolute inset-0 opacity-0 cursor-pointer"
                @input="setBgColor(($event.target as HTMLInputElement).value)"
              />
            </label>
            <span class="text-[10px] text-neutral-400 font-mono uppercase ml-1">{{ bgColor }}</span>
          </div>
        </div>

        <!-- 圆点大小 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.dotSize }}</label>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-500">4</span>
            <input
              type="range"
              min="4"
              max="16"
              :value="dotSize"
              class="flex-1 h-1 accent-neutral-500 cursor-pointer"
              @input="onDotSizeInput"
            />
            <span class="text-[10px] text-neutral-500">16</span>
            <div
              class="ml-1"
              :style="{ width: dotSize + 'px', height: dotSize + 'px', backgroundColor: accentColor, borderRadius: dotBorderRadius }"
            />
            <span class="text-[10px] text-neutral-400 font-mono w-6 text-right">{{ dotSize }}</span>
          </div>
        </div>

        <!-- 点阵密度 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.dotDensity }}</label>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-500">{{ t.sparse }}</span>
            <input
              type="range"
              min="25"
              max="200"
              :value="dotDensity"
              class="flex-1 h-1 accent-neutral-500 cursor-pointer"
              @input="onDensityInput"
            />
            <span class="text-[10px] text-neutral-500">{{ t.dense }}</span>
            <span class="text-[10px] text-neutral-400 font-mono w-8 text-right">{{ dotDensity }}%</span>
          </div>
        </div>

        <!-- 语言 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.language }}</label>
          <div class="flex gap-1.5">
            <button
              class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer"
              :class="locale === 'zh' ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
              :style="locale === 'zh' ? { backgroundColor: accentColor } : {}"
              @click="setLocale('zh' as Locale)"
            >
              中文
            </button>
            <button
              class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer"
              :class="locale === 'en' ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
              :style="locale === 'en' ? { backgroundColor: accentColor } : {}"
              @click="setLocale('en' as Locale)"
            >
              English
            </button>
          </div>
        </div>

        <!-- 点阵动效 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.dotAnimation }}</label>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer"
              :class="dotAnimation ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
              :style="dotAnimation ? { backgroundColor: accentColor } : {}"
              @click="setDotAnimation(true)"
            >{{ t.on }}</button>
            <button
              class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer"
              :class="!dotAnimation ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
              :style="!dotAnimation ? { backgroundColor: accentColor } : {}"
              @click="setDotAnimation(false)"
            >{{ t.off }}</button>
          </div>
        </div>

        <!-- 游玩特效 -->
        <div>
          <label class="text-xs text-neutral-400 mb-2 block">{{ t.dotPlayEffect }}</label>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer"
              :class="dotPlayEffect ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
              :style="dotPlayEffect ? { backgroundColor: accentColor } : {}"
              @click="setDotPlayEffect(true)"
            >{{ t.on }}</button>
            <button
              class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer"
              :class="!dotPlayEffect ? 'text-white font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10'"
              :style="!dotPlayEffect ? { backgroundColor: accentColor } : {}"
              @click="setDotPlayEffect(false)"
            >{{ t.off }}</button>
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
.wheel-enter-active,
.wheel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.wheel-enter-from,
.wheel-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
