<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSettings } from '../composables/useSettings'
import gsap from 'gsap'

const props = defineProps<{
  totalDots: number
  passedDots: number
}>()

const { accentColor, dotBorderRadius, dotAnimation, dotPlayEffect, dotSize: dotSizeSetting } = useSettings()

const DOT_THRESHOLD = 500
const useCanvas = computed(() => props.totalDots > DOT_THRESHOLD && !dotPlayEffect.value)

const displayPassedDots = ref(0)

// ── GSAP play effect state ──
const containerRef = ref<HTMLElement | null>(null)

// Per-dot original positions (grid-relative), computed once on layout
interface DotMeta { el: HTMLElement; origX: number; origY: number; animator: gsap.core.Animation | null }
let dotMetas: DotMeta[] = []

function computeOriginalPositions() {
  if (!containerRef.value) return
  dotMetas = []
  const containerRect = containerRef.value.getBoundingClientRect()
  const children = Array.from(containerRef.value.children) as HTMLElement[]
  children.forEach((el) => {
    const r = el.getBoundingClientRect()
    dotMetas.push({
      el,
      origX: r.left - containerRect.left + r.width / 2,
      origY: r.top - containerRect.top + r.height / 2,
      animator: null,
    })
  })
}

// Magnetic repulsion on mouse move — MagneticBalls.html style
// Only affects colored (passed) dots
function onMouseMove(e: MouseEvent) {
  if (!dotPlayEffect.value || !containerRef.value || dotMetas.length === 0) return
  const containerRect = containerRef.value.getBoundingClientRect()
  const mx = e.clientX - containerRect.left
  const my = e.clientY - containerRect.top
  const mouseRadius = 25
  const passed = displayPassedDots.value

  dotMetas.forEach((meta, idx) => {
    // Only interact with colored dots
    if (idx >= passed) return

    const dx = mx - meta.origX
    const dy = my - meta.origY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < mouseRadius && distance > 0) {
      // Push dot away from mouse, landing on the circle at mouseRadius
      const moveX = mx - (dx / distance) * mouseRadius - meta.origX
      const moveY = my - (dy / distance) * mouseRadius - meta.origY

      if (meta.animator) meta.animator.kill()
      meta.animator = gsap.timeline()
        .to(meta.el, {
          x: moveX,
          y: moveY,
          duration: 0.5,
          ease: 'power3.out',
        })
        .to(meta.el, {
          x: 0,
          y: 0,
          duration: 1,
          ease: 'power3.out',
        }, '<0.1')
    }
  })
}

function onMouseLeave() {
  if (!dotPlayEffect.value) return
  dotMetas.forEach(meta => {
    if (meta.animator) meta.animator.kill()
    gsap.to(meta.el, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.3)',
      overwrite: true,
    })
  })
}

// ── Sequential Lighting Animation (逐行点亮) ──
let animationObj: gsap.core.Tween | null = null

function updateDisplayPassedDots(forceRestart = false) {
  if (animationObj) {
    animationObj.kill()
    animationObj = null
  }

  if (!dotAnimation.value) {
    displayPassedDots.value = props.passedDots
    return
  }

  const target = props.passedDots
  
  if (forceRestart) {
    displayPassedDots.value = 0
  }
  
  const current = displayPassedDots.value
  const distance = Math.abs(target - current)

  if (distance === 0) {
    displayPassedDots.value = target
    return
  }

  // 统一点亮逻辑（DOM 和 Canvas 共用数值插值）
  // 利用纯数值补间，让 CSS 负责 DOM 环境下的样式过渡，逐个渲染
  const isBatched = distance > 1
  const dur = isBatched ? Math.min(1.2, Math.max(0.3, distance * 0.003)) : 0.6
  
  const proxy = { val: current }
  animationObj = gsap.to(proxy, {
    val: target,
    duration: dur,
    ease: 'power1.inOut',
    onUpdate: () => {
      displayPassedDots.value = Math.round(proxy.val)
    }
  })
}

watch(() => props.totalDots, () => {
  nextTick(() => computeOriginalPositions())
  updateDisplayPassedDots(true)
})

watch(() => props.passedDots, (newVal, oldVal) => {
  const isReset = oldVal !== undefined && newVal === 0
  updateDisplayPassedDots(isReset)
})

watch(() => dotAnimation.value, (val) => {
  if (!val && animationObj) {
    animationObj.kill()
    animationObj = null
  }
  displayPassedDots.value = props.passedDots
})

watch([dotPlayEffect], () => {
  nextTick(() => {
    computeOriginalPositions()
  })
})

// ── Canvas mode (high dot count) ──
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function drawCanvas() {
  const canvas = canvasRef.value
  const wrap = canvasWrapRef.value
  if (!canvas || !wrap) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const wrapWidth = wrap.clientWidth

  const ds = dotSizeSetting.value
  const gap = 5
  const cellSize = ds + gap
  const cols = Math.floor(wrapWidth / cellSize) || 1
  const total = props.totalDots
  const passed = displayPassedDots.value
  const accent = accentColor.value
  const rows = Math.ceil(total / cols)
  const requiredHeight = rows * cellSize

  canvas.style.width = wrapWidth + 'px'
  canvas.style.height = requiredHeight + 'px'
  canvas.width = wrapWidth * dpr
  canvas.height = requiredHeight * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, wrapWidth, requiredHeight)

  for (let i = 0; i < total; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = col * cellSize
    const y = row * cellSize

    const isPassed = i < passed
    if (isPassed) { ctx.shadowColor = accent; ctx.shadowBlur = 4 }
    else { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0 }

    ctx.fillStyle = isPassed ? accent : '#555555'
    const radius = (ds / 2) * (dotBorderRadius.value === '50%' ? 1 : parseInt(dotBorderRadius.value) / 50)
    ctx.beginPath()
    ctx.roundRect(x, y, ds, ds, radius)
    ctx.fill()
  }
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
}

let rafPending = false
function scheduleRedraw() {
  if (useCanvas.value && !rafPending) {
    rafPending = true
    requestAnimationFrame(() => { drawCanvas(); rafPending = false })
  }
}

watch(() => [displayPassedDots.value, props.totalDots], scheduleRedraw)
watch([accentColor, dotBorderRadius, dotSizeSetting], scheduleRedraw)
watch(useCanvas, async (val) => {
  if (val) { await nextTick(); setupCanvasResize(); drawCanvas() }
  else { cleanupCanvasResize() }
})

function setupCanvasResize() {
  const wrap = canvasWrapRef.value
  if (!wrap) return
  resizeObserver = new ResizeObserver(() => drawCanvas())
  resizeObserver.observe(wrap)
}
function cleanupCanvasResize() {
  resizeObserver?.disconnect()
  resizeObserver = null
}

onMounted(() => {
  if (useCanvas.value) { setupCanvasResize(); drawCanvas() }
  else {
    nextTick(() => {
      computeOriginalPositions()
    })
  }
  displayPassedDots.value = 0
  updateDisplayPassedDots(true)
})

onUnmounted(() => {
  cleanupCanvasResize()
  dotMetas.forEach(m => m.animator?.kill())
  dotMetas = []
})
</script>

<template>
  <!-- DOM 模式 -->
  <div
    v-if="!useCanvas"
    ref="containerRef"
    class="grid justify-center"
    :style="{
      gridTemplateColumns: `repeat(auto-fill, ${dotSizeSetting}px)`,
      gap: '5px',
      padding: '4px',
      '--accent': accentColor,
      '--accent-glow': accentColor + '80'
    }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div
      v-for="i in totalDots"
      :key="i"
      class="dot-item will-change-transform"
      :class="{ 'is-passed': i <= displayPassedDots }"
      :style="{
        width: dotSizeSetting + 'px',
        height: dotSizeSetting + 'px',
        borderRadius: dotBorderRadius
      }"
    />
  </div>

  <!-- Canvas 模式 -->
  <div v-else ref="canvasWrapRef" class="w-full">
    <canvas ref="canvasRef" class="block" />
  </div>
</template>

<style scoped>
.dot-item {
  background-color: #555555;
  box-shadow: none;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}
.dot-item.is-passed {
  background-color: var(--accent);
  box-shadow: 0 0 5px var(--accent-glow);
  animation: dot-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
@keyframes dot-pop {
  0% { transform: scale(0.5); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
