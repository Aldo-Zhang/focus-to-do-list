// src/lib/db.ts - API proxy for backend communication
export type Priority = 0 | 1 | 2 | 3
export interface Task {
  id: number
  rawText: string
  title: string
  due: string | null
  tags: string[]
  createdAt: string
  urgency: Priority
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function j(r: Response) {
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function listTasks(): Promise<Task[]> {
  const r = await fetch(`${API}/tasks`, { cache: "no-store" })
  return (await j(r)).tasks as Task[]
}

export async function createTask(payload: {
  rawText: string; title?: string; due?: string | null; tags?: string[]; urgency?: number
}): Promise<Task> {
  // If title missing, ask backend stub to rewrite
  if (!payload.title) {
    const rr = await fetch(`${API}/nlp/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: payload.rawText })
    })
    const { title, tags, urgency } = await j(rr)
    payload = { ...payload, title, tags, urgency }
  }
  const r = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  return (await j(r)).task as Task
}

export async function updateTask(id: number, patch: Partial<Omit<Task, "id" | "createdAt">>): Promise<Task> {
  const r = await fetch(`${API}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  })
  return (await j(r)).task as Task
}

export async function deleteTask(id: number): Promise<void> {
  const r = await fetch(`${API}/tasks/${id}`, { method: "DELETE" })
  if (!r.ok) throw new Error(await r.text())
}