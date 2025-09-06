export function isToday(dateString: string | null): boolean {
  if (!dateString) return false

  const date = new Date(dateString)
  const today = new Date()

  return date.toDateString() === today.toDateString()
}

export function daysUntil(dateString: string | null): number {
  if (!dateString) return Number.POSITIVE_INFINITY

  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffTime = date.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function formatDueDate(dateString: string | null): string {
  if (!dateString) return "No due"

  const date = new Date(dateString)
  const days = daysUntil(dateString)

  if (days < 0) {
    return `${Math.abs(days)} days overdue`
  } else if (days === 0) {
    return "Today"
  } else if (days === 1) {
    return "Tomorrow"
  } else if (days <= 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

export function isOverdue(dateString: string | null): boolean {
  return daysUntil(dateString) < 0
}

export function isDueSoon(dateString: string | null): boolean {
  const days = daysUntil(dateString)
  return days >= 0 && days <= 1
}
