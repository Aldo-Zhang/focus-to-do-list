export type Priority = 0 | 1 | 2 | 3
export type Status = "todo" | "done"

export interface Task {
  id: string
  title_raw: string
  title_rewrite: string
  due: string | null // ISO string or null
  created_at: string // ISO
  status: Status
  priority_ai: Priority
  priority_user?: Priority // overrides ai when present
  score: number // computed for sorting
  tags: string[]
  pinned?: boolean
  completed?: boolean
  archived?: boolean
}

export type FilterType = "today" | "upcoming" | "someday" | "all" | "archived"
export type SortType = "score" | "due" | "priority"
