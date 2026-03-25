import { load } from '@tauri-apps/plugin-store'

let store: Awaited<ReturnType<typeof load>> | null = null

async function getStore() {
  if (!store) {
    store = await load('HyTicker-data.json', { defaults: {}, autoSave: true })
  }
  return store
}

export async function saveData<T>(key: string, value: T): Promise<void> {
  const s = await getStore()
  await s.set(key, value)
}

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  const s = await getStore()
  const val = await s.get<T>(key)
  return val ?? fallback
}

export async function deleteData(key: string): Promise<void> {
  const s = await getStore()
  await s.delete(key)
}
