import { ref, computed } from 'vue'
import { saveData, loadData } from './useStore'

export interface TaskLabel {
  id: string
  name: string
  color: string
}

const LABELS_KEY = 'task-labels'
const ACTIVE_KEY = 'active-label'

const labels = ref<TaskLabel[]>([
  { id: 'default', name: 'Focus', color: '#FF8C00' },
])
const activeLabelId = ref('default')

const activeLabel = computed(() =>
  labels.value.find(l => l.id === activeLabelId.value) ?? labels.value[0]
)

export async function loadLabels() {
  const data = await loadData<TaskLabel[]>(LABELS_KEY, [])
  if (data.length > 0) labels.value = data
  activeLabelId.value = await loadData<string>(ACTIVE_KEY, 'default')
}

async function persist() {
  await saveData(LABELS_KEY, labels.value)
  await saveData(ACTIVE_KEY, activeLabelId.value)
}

export function useLabels() {
  function addLabel(name: string, color: string) {
    const id = Date.now().toString(36)
    labels.value.push({ id, name, color })
    persist()
  }

  function removeLabel(id: string) {
    if (id === 'default') return
    labels.value = labels.value.filter(l => l.id !== id)
    if (activeLabelId.value === id) activeLabelId.value = 'default'
    persist()
  }

  function setActiveLabel(id: string) {
    activeLabelId.value = id
    persist()
  }

  return {
    labels,
    activeLabel,
    activeLabelId,
    addLabel,
    removeLabel,
    setActiveLabel,
  }
}
