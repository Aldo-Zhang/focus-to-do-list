"use client"

import type React from "react"

import { useState } from "react"
import type { Task, Priority } from "@/lib/db"
import { formatDueDate, isOverdue, isDueSoon, isToday } from "@/lib/utils-date"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Pin, Trash2, Edit3, Archive, ArchiveRestore } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TaskItemProps {
  task: Task
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, updates: Partial<Task>) => void
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  onEditClick: (task: Task) => void
  isUrgent?: boolean // Add urgent prop for visual emphasis
}

export function TaskItem({ task, onToggleComplete, onDelete, onEdit, onTogglePin, onToggleArchive, onEditClick, isUrgent = false }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title_rewrite)

  const handleEdit = () => {
    if (editTitle.trim() && editTitle !== task.title_rewrite) {
      onEdit(task.id, { 
        title_rewrite: editTitle.trim(),
        title: editTitle.trim() // 同时更新 title 字段
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit()
    } else if (e.key === "Escape") {
      setEditTitle(task.title_rewrite)
      setIsEditing(false)
    }
  }

  const getPriorityDots = (priority: Priority) => {
    const dots = []
    for (let i = 0; i < 4; i++) {
      dots.push(<div key={i} className={cn("w-1.5 h-1.5 rounded-full", i < priority ? "bg-orange-500" : "bg-muted")} />)
    }
    return dots
  }

  const finalPriority = task.priority_user ?? task.priority_ai

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
        isUrgent ? "bg-card shadow-md hover:shadow-lg border-border/50" : "bg-card/50 hover:bg-card border-border/30",
        task.completed && "opacity-60",
        task.archived && "opacity-50 bg-muted/30",
        task.due &&
          isOverdue(task.due) &&
          !task.completed &&
          "border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20",
        task.due &&
          isToday(task.due) &&
          !task.completed &&
          "border-orange-200 bg-orange-50/50 dark:border-orange-800/50 dark:bg-orange-950/20",
      )}
    >
      <button
        onClick={() => onToggleComplete(task.id)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          task.completed
            ? "bg-primary border-primary text-primary-foreground"
            : isUrgent
              ? "border-primary/60 hover:border-primary hover:bg-primary/10"
              : "border-muted-foreground hover:border-primary",
        )}
      >
        {task.completed && <div className="w-3 h-3 bg-primary-foreground rounded-full" />}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full bg-transparent border-none outline-none",
              isUrgent ? "text-base font-medium" : "text-sm",
            )}
            autoFocus
          />
        ) : (
          <div
            className={cn(
              "cursor-pointer",
              isUrgent ? "text-base font-medium" : "text-sm",
              task.completed && "line-through text-muted-foreground",
            )}
            onDoubleClick={() => setIsEditing(true)}
          >
            {task.title_rewrite}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          {task.due && (
            <span
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium",
                isOverdue(task.due)
                  ? "bg-red-500 text-white shadow-sm"
                  : isDueSoon(task.due)
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {formatDueDate(task.due)}
            </span>
          )}

          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {task.pinned && <Pin className="h-3 w-3 text-orange-500" />}

        <div className="flex items-center gap-0.5">{getPriorityDots(finalPriority)}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditClick(task)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleArchive(task.id)}>
              {task.archived ? <ArchiveRestore className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              {task.archived ? "Restore" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePin(task.id)}>
              <Pin className="h-4 w-4 mr-2" />
              {task.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
