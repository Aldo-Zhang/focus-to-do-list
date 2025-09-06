import type { Task } from "./db"
import { rewriteAndClassify } from "./ai"
import { computeScore } from "./task-utils"

function createTask(rawTitle: string, dueOverride?: string | null): Task {
  const classified = rewriteAndClassify(rawTitle)
  const id = Math.random().toString(36).substr(2, 9)
  const created_at = new Date().toISOString()

  const task: Task = {
    id,
    title_raw: rawTitle,
    title: classified.rewrite,
    title_rewrite: classified.rewrite,
    due: dueOverride !== undefined ? dueOverride : classified.dueISO,
    created_at,
    updated_at: created_at,
    status: "todo",
    priority_ai: classified.priority,
    score: 0,
    tags: classified.tags,
    pinned: false,
    completed: false,
    archived: false,
  }

  task.score = computeScore(task)
  return task
}

export function getSeedTasks(): Task[] {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const friday = new Date(today)
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7
  friday.setDate(friday.getDate() + daysUntilFriday)
  friday.setHours(17, 0, 0, 0)

  const pastDue = new Date(today)
  pastDue.setDate(pastDue.getDate() - 2)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    createTask("Submit resume to A company by Fri 5pm", friday.toISOString()),
    createTask("Dinner with Henry on Friday 7pm", friday.toISOString()),
    createTask("Call insurance to update RX", pastDue.toISOString()),
    createTask("30-min workout", today.toISOString()),
    createTask("Book dentist appointment this month", nextWeek.toISOString()),
    createTask("Study LLM paper (no hard deadline)", null),
    createTask("Buy groceries for the week", tomorrow.toISOString()),
    createTask("Review job offer from startup", today.toISOString()),
  ]
}
