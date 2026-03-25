import { ref, onUnmounted, watch, type Ref } from 'vue'

/** 时间模式枚举 */
export enum TimeMode {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

/** 引擎状态 */
export type EngineStatus = 'running' | 'paused' | 'stopped'

export interface TimeEngineOptions {
  /** 时间模式 */
  mode: Ref<TimeMode>
  /** 自定义模式的时长（秒） */
  customDurationSec?: Ref<number>
  /** 矩阵最大点数上限，防止渲染过多 DOM */
  maxDots?: number
  /** 密度比例 (0.5 ~ 2.0)，乘以基础点数 */
  densityScale?: Ref<number>
  /** 自定义番茄钟完成回调 */
  onComplete?: () => void
}

export interface TimeEngineReturn {
  totalDots: Ref<number>
  passedDots: Ref<number>
  progressPercentage: Ref<number>
  /** 当前周期的剩余时间文本 (HH:MM:SS) */
  remainingText: Ref<string>
  /** 引擎状态 */
  status: Ref<EngineStatus>
  /** 用于自定义番茄钟：开始 / 暂停 / 重置 */
  start: () => void
  pause: () => void
  reset: () => void
}

/**
 * 核心时间引擎 Composable
 *
 * 使用 requestAnimationFrame + 绝对时间戳驱动，防止时间漂移。
 * 自然时间模式（DAY/WEEK/MONTH/YEAR）自动运行；
 * CUSTOM 模式需手动 start()。
 */
export function useTimeEngine(options: TimeEngineOptions): TimeEngineReturn {
  const { mode, customDurationSec, maxDots = 1440, densityScale, onComplete } = options

  // ── 响应式状态 ──────────────────────────────────
  const totalDots = ref(0)
  const passedDots = ref(0)
  const progressPercentage = ref(0)
  const remainingText = ref('00:00:00')
  const status = ref<EngineStatus>('stopped')

  // ── 内部变量 ─────────────────────────────────────
  let rafId = 0
  /** CUSTOM 模式的起始时间戳 (ms) */
  let customStartTs = 0
  /** CUSTOM 模式暂停时已累计的时间 (ms) */
  let customElapsedBeforePause = 0

  // ── 工具函数 ─────────────────────────────────────

  /** 获取当天 00:00:00 的时间戳 */
  function startOfDay(date: Date): number {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  /** 获取当周一 00:00:00 的时间戳 (ISO: 周一=1) */
  function startOfWeek(date: Date): number {
    const d = new Date(date)
    const day = d.getDay() || 7 // Sunday → 7
    d.setDate(d.getDate() - (day - 1))
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  /** 获取当月 1 号 00:00:00 */
  function startOfMonth(date: Date): number {
    const d = new Date(date.getFullYear(), date.getMonth(), 1)
    return d.getTime()
  }

  /** 获取当年 1 月 1 日 00:00:00 */
  function startOfYear(date: Date): number {
    return new Date(date.getFullYear(), 0, 1).getTime()
  }

  /** 当月总天数 */
  function daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  /** 当年总天数 */
  function daysInYear(date: Date): number {
    const y = date.getFullYear()
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365
  }

  /** 秒数 → HH:MM:SS */
  function formatRemaining(totalSec: number): string {
    const sec = Math.max(0, Math.floor(totalSec))
    const h = String(Math.floor(sec / 3600)).padStart(2, '0')
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  /** 限制点数在合理范围，并应用密度缩放 */
  function clampDots(n: number): number {
    const scale = densityScale?.value ?? 1
    return Math.min(Math.round(n * scale), maxDots)
  }

  // ── 进度计算 ─────────────────────────────────────

  function calcNaturalProgress(now: Date): { total: number; passed: number; remainSec: number } {
    const m = mode.value
    let periodStartMs: number
    let periodTotalMs: number

    switch (m) {
      case TimeMode.DAY: {
        periodStartMs = startOfDay(now)
        periodTotalMs = 24 * 3600_000
        break
      }
      case TimeMode.WEEK: {
        periodStartMs = startOfWeek(now)
        periodTotalMs = 7 * 24 * 3600_000
        break
      }
      case TimeMode.MONTH: {
        periodStartMs = startOfMonth(now)
        periodTotalMs = daysInMonth(now) * 24 * 3600_000
        break
      }
      case TimeMode.YEAR: {
        periodStartMs = startOfYear(now)
        periodTotalMs = daysInYear(now) * 24 * 3600_000
        break
      }
      default:
        return { total: 0, passed: 0, remainSec: 0 }
    }

    const elapsedMs = now.getTime() - periodStartMs
    const ratio = Math.min(elapsedMs / periodTotalMs, 1)

    // 根据模式选择合适的点数
    let dots: number
    switch (m) {
      case TimeMode.DAY:
        dots = clampDots(24 * 60) // 每分钟 1 个点 → 1440
        break
      case TimeMode.WEEK:
        dots = clampDots(7 * 24 * 2) // 每半小时 1 个点 → 336
        break
      case TimeMode.MONTH:
        dots = clampDots(daysInMonth(now) * 24) // 每小时 1 个点
        break
      case TimeMode.YEAR:
        dots = clampDots(daysInYear(now)) // 每天 1 个点
        break
      default:
        dots = 0
    }

    const passed = Math.floor(ratio * dots)
    const remainSec = (periodTotalMs - elapsedMs) / 1000

    return { total: dots, passed, remainSec }
  }

  function calcCustomProgress(): { total: number; passed: number; remainSec: number } {
    const durationSec = customDurationSec?.value ?? 25 * 60
    const durationMs = durationSec * 1000
    // 番茄钟每分钟固定 1 个点，不受 densityScale 影响
    const dots = Math.min(Math.max(1, Math.ceil(durationSec / 60)), maxDots)

    if (status.value === 'stopped') {
      return { total: dots, passed: 0, remainSec: durationSec }
    }

    let elapsedMs: number
    if (status.value === 'paused') {
      elapsedMs = customElapsedBeforePause
    } else {
      elapsedMs = customElapsedBeforePause + (Date.now() - customStartTs)
    }

    elapsedMs = Math.min(elapsedMs, durationMs)
    const ratio = elapsedMs / durationMs
    const passed = Math.floor(ratio * dots)
    const remainSec = (durationMs - elapsedMs) / 1000

    return { total: dots, passed, remainSec }
  }

  // ── rAF 循环 ─────────────────────────────────────

  function tick() {
    const now = new Date()
    let result: { total: number; passed: number; remainSec: number }

    if (mode.value === TimeMode.CUSTOM) {
      result = calcCustomProgress()
      // 自动完成
      if (status.value === 'running' && result.remainSec <= 0) {
        status.value = 'stopped'
        onComplete?.()
      }
    } else {
      result = calcNaturalProgress(now)
      status.value = 'running'
    }

    totalDots.value = result.total
    passedDots.value = result.passed
    progressPercentage.value = result.total > 0
      ? Math.round((result.passed / result.total) * 10000) / 100
      : 0
    remainingText.value = formatRemaining(result.remainSec)

    rafId = requestAnimationFrame(tick)
  }

  // ── 启停控制（主要用于 CUSTOM 模式） ────────────

  function start() {
    if (mode.value === TimeMode.CUSTOM) {
      if (status.value === 'running') return
      customStartTs = Date.now()
      if (status.value === 'stopped') {
        customElapsedBeforePause = 0
      }
      status.value = 'running'
    }
  }

  function pause() {
    if (mode.value === TimeMode.CUSTOM && status.value === 'running') {
      customElapsedBeforePause += Date.now() - customStartTs
      status.value = 'paused'
    }
  }

  function reset() {
    if (mode.value === TimeMode.CUSTOM) {
      customElapsedBeforePause = 0
      customStartTs = 0
      status.value = 'stopped'
    }
  }

  // ── 生命周期 ─────────────────────────────────────

  // 模式切换时保留番茄钟进度
  let customSavedStatus: EngineStatus = 'stopped'

  watch(mode, (newMode, oldMode) => {
    // 离开 CUSTOM：保存计时状态
    if (oldMode === TimeMode.CUSTOM) {
      if (status.value === 'running') {
        customElapsedBeforePause += Date.now() - customStartTs
        customSavedStatus = 'paused'
      } else {
        customSavedStatus = status.value
      }
    }

    // 进入新模式
    if (newMode === TimeMode.CUSTOM) {
      status.value = customSavedStatus
      if (status.value === 'running') {
        customStartTs = Date.now()
      }
    } else {
      status.value = 'running'
    }
  })

  // 启动 rAF 循环
  rafId = requestAnimationFrame(tick)

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
  })

  return {
    totalDots,
    passedDots,
    progressPercentage,
    remainingText,
    status,
    start,
    pause,
    reset,
  }
}
