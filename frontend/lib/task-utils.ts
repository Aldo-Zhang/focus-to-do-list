import type { Task, Priority } from "./db"

export function computeScore(task: Task): number {
  const priority_final: Priority = task.priority_user ?? task.priority_ai
  const time_decay = task.due ? 1 / (1 + Math.max(0, daysUntil(task.due))) : 0.2
  const score = 10 * priority_final + 6 * time_decay + (task.pinned ? 100 : 0)
  return score
}

// Helper function for computeScore compatibility
function daysUntil(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function computeUrgency(task: Task): number {
  const now = new Date()

  if (task.due) {
    const dueDate = new Date(task.due)
    const diffMs = dueDate.getTime() - now.getTime()

    if (diffMs < 0) {
      // Overdue: higher urgency for longer overdue tasks
      const minutesOverdue = Math.abs(diffMs) / (1000 * 60)
      return 1000 + minutesOverdue
    } else {
      // Future due date: sooner = higher urgency
      const hoursUntilDue = diffMs / (1000 * 60 * 60)
      return 1 / (1 + hoursUntilDue)
    }
  }

  // No due date
  return 0
}

export function computeFinalUrgency(task: Task): number {
  const baseUrgency = computeUrgency(task)
  const priorityNudge = task.priority_user ? 0.05 * task.priority_user : 0
  return baseUrgency + priorityNudge
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // First priority: pinned tasks
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1

    // Second priority: urgency
    const urgencyA = computeFinalUrgency(a)
    const urgencyB = computeFinalUrgency(b)

    if (urgencyA !== urgencyB) {
      return urgencyB - urgencyA // Higher urgency first
    }

    // Tie-breaker: created_at ascending (older first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

export function updateTaskScore(task: Task): Task {
  return task // No longer computing score, just return task as-is
}

export function isOverdue(task: Task): boolean {
  if (!task.due) return false
  return new Date(task.due) < new Date()
}

export function isDueSoon(task: Task): boolean {
  if (!task.due) return false
  const now = new Date()
  const due = new Date(task.due)
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilDue > 0 && hoursUntilDue <= 24
}
