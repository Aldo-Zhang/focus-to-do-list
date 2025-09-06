// lib/db.ts - API proxy for backend communication
export type Priority = 0 | 1 | 2 | 3
export type FilterType = "today" | "upcoming" | "someday" | "all" | "archived"
export interface Task {
  id: string
  title_raw: string
  title: string
  title_rewrite: string
  due: string | null
  tags: string[]
  created_at: string
  updated_at: string
  status: 'todo' | 'done'
  priority_ai: Priority
  priority_user?: Priority
  score: number
  pinned: boolean
  completed: boolean
  archived: boolean
}

export interface RewriteResult {
  title: string
  tags: string[]
  urgency: number
  due?: string
}

export interface Settings {
  ollamaBaseUrl: string
  ollamaModel: string
  userRules: string
}

const API = "http://localhost:4000" // Hardcoded for Tauri environment

console.log('API URL:', API) // Debug log

async function j(r: Response) {
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function listTasks(): Promise<Task[]> {
  console.log('Fetching tasks from:', `${API}/tasks`) // Debug log
  const r = await fetch(`${API}/tasks`, { cache: "no-store" })
  const data = await j(r)
  console.log('Received data:', data) // Debug log
  return data.tasks as Task[]
}

export async function createTask(payload: {
  rawText: string; title?: string; due?: string | null; tags?: string[]; urgency?: number
}): Promise<Task> {
  const r = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  return (await j(r)).task as Task
}

export async function rewriteTask(rawText: string, userRules?: string): Promise<RewriteResult> {
  const r = await fetch(`${API}/ai/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText, userRules })
  })
  return await j(r) as RewriteResult
}

export async function updateTask(id: string, patch: Partial<Omit<Task, "id" | "created_at" | "updated_at">>): Promise<Task> {
  const r = await fetch(`${API}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  })
  return (await j(r)).task as Task
}

export async function deleteTask(id: string): Promise<void> {
  const r = await fetch(`${API}/tasks/${id}`, { method: "DELETE" })
  if (!r.ok) throw new Error(await r.text())
}

// Additional exports required by app/page.tsx

export async function toggleTaskComplete(id: string): Promise<Task> {
  const r = await fetch(`${API}/tasks/${id}/toggle-complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" }
  })
  return (await j(r)).task as Task
}

export async function toggleTaskPin(id: string): Promise<Task> {
  const r = await fetch(`${API}/tasks/${id}/toggle-pin`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" }
  })
  return (await j(r)).task as Task
}

export async function toggleTaskArchive(id: string): Promise<Task> {
  const r = await fetch(`${API}/tasks/${id}/toggle-archive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" }
  })
  return (await j(r)).task as Task
}

export async function seedDatabase(): Promise<void> {
  // Call backend to seed database
  const r = await fetch(`${API}/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
  if (!r.ok) throw new Error(await r.text())
}

// 设置管理
export async function getSettings(): Promise<Settings> {
  const r = await fetch(`${API}/settings`)
  return await j(r) as Settings
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const r = await fetch(`${API}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings)
  })
  return await j(r) as Settings
}

// AI 连接测试
export async function testAIConnection(): Promise<boolean> {
  try {
    const r = await fetch(`${API}/ai/test`)
    const result = await j(r)
    return result.connected
  } catch {
    return false
  }
}