<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSettings } from '../composables/useSettings'
import gsap from 'gsap'

const props = defineProps<{
  totalDots: number
  passedDots: number
}>()

const { accentColor, dotBorderRadius, dotAnimation, dotPlayEffect } = useSettings()

const DOT_THRESHOLD = 500
const useCanvas = computed(() => props.totalDots > DOT_THRESHOLD && !dotPlayEffect.value)

const columns = computed(() => {
  const t = props.totalDots
  if (t <= 100) return 10
  if (t <= 300) return 15
  if (t <= 500) return 20
  return 24
})

// ── GSAP play effect state ──
const containerRef = ref<HTMLElement | null>(null)

// Per-dot original positions (grid-relative), computed once on layout
interface DotMeta { el: HTMLElement; origX: number; origY: number; animator: gsap.core.Timeline | null }
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
  const passed = props.passedDots

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

// Track previous passed dots for animation
let prevPassed = 0

function animateNewDots() {
  if (!dotAnimation.value || useCanvas.value) return
  nextTick(() => {
    if (!containerRef.value) return
    const children = Array.from(containerRef.value.children) as HTMLElement[]
    const newlyPassed = props.passedDots

    // Animate every colored dot that is new since last check
    if (newlyPassed > prevPassed) {
      const start = Math.max(prevPassed, 0)
      for (let i = start; i < newlyPassed && i < children.length; i++) {
        gsap.fromTo(children[i], {
          scale: 0,
          opacity: 0,
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          delay: (i - start) * 0.02,
          ease: 'back.out(2)',
          overwrite: true,
        })
      }
    }
    prevPassed = newlyPassed
  })
}

// Reset prevPassed when total dots change (mode switch / density change)
watch(() => props.totalDots, () => {
  prevPassed = 0
  nextTick(() => computeOriginalPositions())
})

watch(() => props.passedDots, animateNewDots)

watch([dotPlayEffect], () => {
  nextTick(() => {
    computeOriginalPositions()
  })
})

// ── Canvas mode (high dot count) ──
const canvasRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const dotSize = 6
  const gap = 5
  const cellSize = dotSize + gap
  const cols = Math.floor(rect.width / cellSize) || 1
  const total = props.totalDots
  const passed = props.passedDots
  const accent = accentColor.value

  ctx.clearRect(0, 0, rect.width, rect.height)

  for (let i = 0; i < total; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = col * cellSize
    const y = row * cellSize
    if (y + dotSize > rect.height) break

    const isPassed = i < passed
    if (isPassed) { ctx.shadowColor = accent; ctx.shadowBlur = 4 }
    else { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0 }

    ctx.fillStyle = isPassed ? accent : '#555555'
    const radius = (dotSize / 2) * (dotBorderRadius.value === '50%' ? 1 : parseInt(dotBorderRadius.value) / 50)
    ctx.beginPath()
    ctx.roundRect(x, y, dotSize, dotSize, radius)
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

watch(() => [props.passedDots, props.totalDots], scheduleRedraw)
watch([accentColor, dotBorderRadius], scheduleRedraw)
watch(useCanvas, async (val) => {
  if (val) { await nextTick(); setupCanvasResize(); drawCanvas() }
  else { cleanupCanvasResize() }
})

function setupCanvasResize() {
  const canvas = canvasRef.value
  if (!canvas) return
  resizeObserver = new ResizeObserver(() => drawCanvas())
  resizeObserver.observe(canvas)
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
  prevPassed = props.passedDots
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
      gridTemplateColumns: `repeat(auto-fill, 10px)`,
      gap: '5px',
      padding: '4px',
    }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div
      v-for="i in totalDots"
      :key="i"
      class="w-2.5 h-2.5 transition-colors duration-300 will-change-transform"
      :style="{
        borderRadius: dotBorderRadius,
        backgroundColor: i <= passedDots ? accentColor : '#555555',
        boxShadow: i <= passedDots ? `0 0 5px ${accentColor}80` : 'none',
      }"
    />
  </div>

  <!-- Canvas 模式 -->
  <canvas
    v-else
    ref="canvasRef"
    class="w-full h-full block"
  />
</template>
