export type Priority = 0 | 1 | 2 | 3

export function rewriteAndClassify(input: string): {
  rewrite: string
  priority: Priority
  tags: string[]
  dueISO: string | null
} {
  return {
    rewrite: simpleRewrite(input),
    priority: simplePriority(input),
    tags: inferTags(input),
    dueISO: inferDue(input),
  }
}

function simpleRewrite(input: string): string {
  // Convert to imperative form
  const text = input.trim()

  // Simple patterns to make it more actionable
  if (text.toLowerCase().includes("need to ") || text.toLowerCase().includes("i need to ")) {
    return text.replace(/^(i )?need to /i, "").replace(/^./, (str) => str.toUpperCase())
  }

  if (text.toLowerCase().includes("should ") || text.toLowerCase().includes("i should ")) {
    return text.replace(/^(i )?should /i, "").replace(/^./, (str) => str.toUpperCase())
  }

  // Capitalize first letter if not already
  return text.replace(/^./, (str) => str.toUpperCase())
}

function simplePriority(input: string): Priority {
  const text = input.toLowerCase()
  let priority: Priority = 1 // default

  // Job-related tasks get higher priority
  if (text.match(/\b(resume|job|offer|recruiter|interview|oa|application)\b/)) {
    priority = Math.min(3, priority + 1) as Priority
  }

  // Health-related tasks get higher priority
  if (text.match(/\b(doctor|rx|insurance|appointment|medical|health)\b/)) {
    priority = Math.min(3, priority + 1) as Priority
  }

  // Social tasks get lower priority
  if (text.match(/\b(dinner|party|hangout|social|drinks|coffee)\b/)) {
    priority = Math.max(0, priority - 1) as Priority
  }

  // Urgent keywords
  if (text.match(/\b(urgent|asap|important|critical|deadline)\b/)) {
    priority = 3
  }

  return priority
}

function inferTags(input: string): string[] {
  const text = input.toLowerCase()
  const tags: string[] = []

  if (text.match(/\b(resume|job|offer|recruiter|interview|oa|application)\b/)) {
    tags.push("work")
  }

  if (text.match(/\b(dinner|party|hangout|social|drinks|coffee)\b/)) {
    tags.push("social")
  }

  if (text.match(/\b(doctor|rx|insurance|appointment|medical|health)\b/)) {
    tags.push("health")
  }

  if (text.match(/\b(study|read|learn|research|book|paper)\b/)) {
    tags.push("learning")
  }

  if (text.match(/\b(workout|exercise|gym|run|fitness)\b/)) {
    tags.push("fitness")
  }

  if (text.match(/\b(buy|shop|purchase|order)\b/)) {
    tags.push("shopping")
  }

  return tags
}

function inferDue(input: string): string | null {
  const text = input.toLowerCase()
  const now = new Date()

  // Today
  if (text.match(/\btoday\b/)) {
    return now.toISOString()
  }

  // Tomorrow
  if (text.match(/\btomorrow\b/)) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString()
  }

  // This week days
  const dayMatch = text.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/,
  )
  if (dayMatch) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const shortDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

    const targetDay = dayMatch[1]
    let dayIndex = days.indexOf(targetDay)
    if (dayIndex === -1) {
      dayIndex = shortDays.indexOf(targetDay)
    }

    if (dayIndex !== -1) {
      const targetDate = new Date(now)
      const currentDay = now.getDay()
      let daysUntil = dayIndex - currentDay

      if (daysUntil <= 0) {
        daysUntil += 7 // Next week
      }

      targetDate.setDate(targetDate.getDate() + daysUntil)

      // Check for time
      const timeMatch = text.match(/(\d{1,2})(:\d{2})?\s*(am|pm)/)
      if (timeMatch) {
        let hour = Number.parseInt(timeMatch[1])
        const minute = timeMatch[2] ? Number.parseInt(timeMatch[2].slice(1)) : 0
        const ampm = timeMatch[3]

        if (ampm === "pm" && hour !== 12) hour += 12
        if (ampm === "am" && hour === 12) hour = 0

        targetDate.setHours(hour, minute, 0, 0)
      }

      return targetDate.toISOString()
    }
  }

  return null
}

export function generateUserRulesPreview(): string {
  return [
    "• Tasks containing {job, offer, recruiter, OA, resume} → priority +1",
    "• Tasks containing {dinner, party, hangout} → priority -1",
    "• {doctor, RX, insurance} → priority +1",
    "• Study/Read/Organize without deadline → priority 0",
  ].join("\n")
}
