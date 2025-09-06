"use client"

import type { Task } from "@/lib/db"
import { TaskItem } from "./task-item"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, updates: Partial<Task>) => void
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  onEditClick: (task: Task) => void
  onQuickAdd?: () => void
  isUrgent?: boolean
}

export function TaskList({ tasks, onToggleComplete, onDelete, onEdit, onTogglePin, onToggleArchive, onEditClick, onQuickAdd, isUrgent }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+N</kbd> to add your first task
          </p>
          <Button onClick={onQuickAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4">
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            onEditClick={onEditClick}
            isUrgent={isUrgent}
          />
        ))}
      </div>
    </div>
  )
}
