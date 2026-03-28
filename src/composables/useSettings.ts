import { ref, computed, watch } from 'vue'
import { saveData, loadData } from './useStore'

const accentColor = ref('#FF8C00')
const dotRoundness = ref(50)
const fontSize = ref(12)
const buttonSize = ref(24)
const windowOpacity = ref(88)     // 0-100
const bgColor = ref('#4B4B4B')
const dotDensity = ref(50)        // 25-200 百分比
const dotSize = ref(10)           // 4-16 圆点大小(px)
const dotAnimation = ref(true)    // 点阵动效开关
const dotPlayEffect = ref(false)  // 点阵游玩特效 (GSAP)

const dotBorderRadius = computed(() => `${dotRoundness.value}%`)

/** 用 dotDensity 缩放 maxDots: base * density/100 */
const densityScale = computed(() => dotDensity.value / 100)

// ── 持久化 ──
const SETTINGS_KEY = 'app-settings'

interface PersistedSettings {
  accentColor: string
  dotRoundness: number
  fontSize: number
  buttonSize: number
  windowOpacity: number
  bgColor: string
  dotDensity: number
  dotSize: number
  dotAnimation: boolean
  dotPlayEffect: boolean
}

function getSnapshot(): PersistedSettings {
  return {
    accentColor: accentColor.value,
    dotRoundness: dotRoundness.value,
    fontSize: fontSize.value,
    buttonSize: buttonSize.value,
    windowOpacity: windowOpacity.value,
    bgColor: bgColor.value,
    dotDensity: dotDensity.value,
    dotSize: dotSize.value,
    dotAnimation: dotAnimation.value,
    dotPlayEffect: dotPlayEffect.value,
  }
}

let loaded = false

export async function loadSettings() {
  if (loaded) return
  const data = await loadData<PersistedSettings | null>(SETTINGS_KEY, null)
  if (data) {
    accentColor.value = data.accentColor ?? '#FF8C00'
    dotRoundness.value = data.dotRoundness ?? 50
    fontSize.value = data.fontSize ?? 12
    buttonSize.value = data.buttonSize ?? 24
    windowOpacity.value = data.windowOpacity ?? 88
    bgColor.value = data.bgColor ?? '#4B4B4B'
    dotDensity.value = data.dotDensity ?? 50
    dotSize.value = data.dotSize ?? 10
    dotAnimation.value = data.dotAnimation ?? true
    dotPlayEffect.value = data.dotPlayEffect ?? false
  }
  loaded = true
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveData(SETTINGS_KEY, getSnapshot()), 300)
}

// 自动持久化
watch(
  [accentColor, dotRoundness, fontSize, buttonSize, windowOpacity, bgColor, dotDensity, dotSize, dotAnimation, dotPlayEffect],
  debouncedSave,
)

export function useSettings() {
  function setAccentColor(color: string) { accentColor.value = color }
  function setDotRoundness(val: number) { dotRoundness.value = Math.max(0, Math.min(50, val)) }
  function setFontSize(val: number) { fontSize.value = Math.max(10, Math.min(18, val)) }
  function setButtonSize(val: number) { buttonSize.value = Math.max(18, Math.min(32, val)) }
  function setWindowOpacity(val: number) { windowOpacity.value = Math.max(20, Math.min(100, val)) }
  function setBgColor(color: string) { bgColor.value = color }
  function setDotDensity(val: number) { dotDensity.value = Math.max(25, Math.min(200, val)) }
  function setDotSize(val: number) { dotSize.value = Math.max(4, Math.min(16, val)) }
  function setDotAnimation(val: boolean) { dotAnimation.value = val }
  function setDotPlayEffect(val: boolean) { dotPlayEffect.value = val }

  return {
    accentColor, dotRoundness, dotBorderRadius,
    fontSize, buttonSize,
    windowOpacity, bgColor,
    dotDensity, densityScale, dotSize,
    dotAnimation, dotPlayEffect,
    setAccentColor, setDotRoundness,
    setFontSize, setButtonSize,
    setWindowOpacity, setBgColor,
    setDotDensity, setDotSize, setDotAnimation, setDotPlayEffect,
  }
}
