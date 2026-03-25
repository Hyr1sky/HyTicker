import { ref, computed } from 'vue'
import { saveData, loadData } from './useStore'

export interface PomodoroRecord {
  label: string
  labelColor?: string
  startTime: number   // epoch ms
  durationMin: number
  completed: boolean
}

export interface DailyStats {
  date: string        // YYYY-MM-DD
  focusMinutes: number
  completedPomodoros: number
  records: PomodoroRecord[]
}

const STATS_KEY = 'pomodoro-stats'

const allStats = ref<DailyStats[]>([])

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getOrCreateToday(): DailyStats {
  const key = todayKey()
  let entry = allStats.value.find(s => s.date === key)
  if (!entry) {
    entry = { date: key, focusMinutes: 0, completedPomodoros: 0, records: [] }
    allStats.value.push(entry)
  }
  return entry
}

export async function loadStats() {
  const data = await loadData<DailyStats[]>(STATS_KEY, [])
  allStats.value = data
}

async function persist() {
  await saveData(STATS_KEY, allStats.value)
}

export function useStats() {
  const today = computed(() => {
    const key = todayKey()
    return allStats.value.find(s => s.date === key) ?? { date: key, focusMinutes: 0, completedPomodoros: 0, records: [] }
  })

  const last7Days = computed(() => {
    const now = new Date()
    const result: DailyStats[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const existing = allStats.value.find(s => s.date === key)
      result.push(existing ?? { date: key, focusMinutes: 0, completedPomodoros: 0, records: [] })
    }
    return result
  })

  const totalFocusMinutes = computed(() => allStats.value.reduce((acc, s) => acc + s.focusMinutes, 0))
  const totalPomodoros = computed(() => allStats.value.reduce((acc, s) => acc + s.completedPomodoros, 0))

  async function recordPomodoro(label: string, durationMin: number, completed: boolean, labelColor?: string) {
    const entry = getOrCreateToday()
    entry.records.push({
      label,
      labelColor,
      startTime: Date.now(),
      durationMin,
      completed,
    })
    if (completed) {
      entry.focusMinutes += durationMin
      entry.completedPomodoros += 1
    }
    await persist()
  }

  return {
    allStats,
    today,
    last7Days,
    totalFocusMinutes,
    totalPomodoros,
    recordPomodoro,
  }
}
