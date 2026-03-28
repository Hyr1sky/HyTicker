import { ref, computed } from 'vue'
import { saveData, loadData } from './useStore'

export type Locale = 'zh' | 'en'

const translations = {
  zh: {
    appName: 'HyTicker',
    lockTooltip: '锁定位置',
    unlockTooltip: '解锁位置',
    pinTooltip: '置顶',
    unpinTooltip: '取消置顶',
    settingsTooltip: '设置',
    closeTooltip: '关闭',
    modeDay: '日',
    modeWeek: '周',
    modeMonth: '月',
    modeYear: '年',
    modeCustom: '番茄钟',
    minutes: '分钟',
    start: '开始',
    resume: '继续',
    pause: '暂停',
    reset: '重置',
    labelDay: '今日',
    labelWeek: '本周',
    labelMonth: '本月',
    labelYear: '今年',
    labelCustom: '番茄钟',
    remaining: '剩余',
    settings: '设置',
    themeColor: '主题色',
    dotRadius: '圆点形状',
    square: '方形',
    circle: '圆形',
    language: '语言',
    fontSize: '字体大小',
    buttonSize: '按钮大小',
    windowOpacity: '窗口透明度',
    bgColor: '背景颜色',
    dotDensity: '点阵密度',
    dotSize: '圆点大小',
    dotAnimation: '点阵动效',
    dotPlayEffect: '游玩特效',
    sparse: '稀疏',
    dense: '密集',
    on: '开',
    off: '关',
    // 统计面板
    statistics: '统计',
    todayFocus: '今日专注',
    todayPomodoros: '今日番茄',
    totalFocus: '累计专注',
    totalPomodoros: '累计番茄',
    last7Days: '最近7天',
    min: '分钟',
    // 任务标签
    taskLabel: '任务标签',
    addLabel: '添加标签',
    labelName: '名称',
    noLabel: '无标签',
    deleteLabel: '删除',
    statsTooltip: '统计',
    pomodoroComplete: '番茄钟完成！',
    pomodoroCompleteBody: '休息一下吧 🍅',
    dayDetail: '当日明细',
    noRecords: '暂无记录',
  },
  en: {
    appName: 'HyTicker',
    lockTooltip: 'Lock position',
    unlockTooltip: 'Unlock position',
    pinTooltip: 'Pin on top',
    unpinTooltip: 'Unpin',
    settingsTooltip: 'Settings',
    closeTooltip: 'Close',
    modeDay: 'Day',
    modeWeek: 'Week',
    modeMonth: 'Month',
    modeYear: 'Year',
    modeCustom: 'Pomodoro',
    minutes: 'min',
    start: 'Start',
    resume: 'Resume',
    pause: 'Pause',
    reset: 'Reset',
    labelDay: 'Today',
    labelWeek: 'This Week',
    labelMonth: 'This Month',
    labelYear: 'This Year',
    labelCustom: 'Pomodoro',
    remaining: 'Left',
    settings: 'Settings',
    themeColor: 'Accent Color',
    dotRadius: 'Dot Shape',
    square: 'Square',
    circle: 'Circle',
    language: 'Language',
    fontSize: 'Font Size',
    buttonSize: 'Button Size',
    windowOpacity: 'Opacity',
    bgColor: 'Background',
    dotDensity: 'Dot Density',
    dotSize: 'Dot Size',
    dotAnimation: 'Dot Animation',
    dotPlayEffect: 'Play Effect',
    sparse: 'Sparse',
    dense: 'Dense',
    on: 'On',
    off: 'Off',
    statistics: 'Statistics',
    todayFocus: 'Today Focus',
    todayPomodoros: 'Today Pomodoros',
    totalFocus: 'Total Focus',
    totalPomodoros: 'Total Pomodoros',
    last7Days: 'Last 7 Days',
    min: 'min',
    taskLabel: 'Task Label',
    addLabel: 'Add Label',
    labelName: 'Name',
    noLabel: 'None',
    deleteLabel: 'Delete',
    statsTooltip: 'Statistics',
    pomodoroComplete: 'Pomodoro Complete!',
    pomodoroCompleteBody: 'Time for a break 🍅',
    dayDetail: 'Day Detail',
    noRecords: 'No records',
  },
} as const

export type TranslationKey = keyof (typeof translations)['zh']

const LOCALE_KEY = 'app-locale'
const locale = ref<Locale>('en')

export async function loadLocale() {
  locale.value = await loadData<Locale>(LOCALE_KEY, 'en')
}

const t = computed(() => translations[locale.value])

export function useI18n() {
  function setLocale(l: Locale) {
    locale.value = l
    saveData(LOCALE_KEY, l)
  }

  return { locale, t, setLocale }
}
