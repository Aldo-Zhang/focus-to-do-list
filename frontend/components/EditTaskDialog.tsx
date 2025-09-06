"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Task } from "@/lib/db"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSave: (id: string, updates: Partial<Task>) => Promise<void>
}

export function EditTaskDialog({ open, onOpenChange, task, onSave }: EditTaskDialogProps) {
  const [title, setTitle] = React.useState("")
  const [due, setDue] = React.useState("")
  const [tagsInput, setTagsInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const savingRef = React.useRef(false)

  // Update form when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title_rewrite || "")
      setDue(task.due ? task.due.split('T')[0] : "")
      setTagsInput(task.tags.join(", "))
    }
  }, [task])

  // Prevent background scroll when dialog is open
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Ensure solid background in both light and dark modes
  React.useEffect(() => {
    if (!open) return
    
    const dialogContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement
    if (dialogContent) {
      const isDark = document.documentElement.classList.contains('dark')
      dialogContent.style.backgroundColor = isDark ? '#171717' : '#ffffff'
    }
  }, [open])

  const handleSave = async () => {
    if (!task || savingRef.current) return
    
    savingRef.current = true
    setIsLoading(true)
    
    try {
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      const updates: Partial<Task> = {
        title_rewrite: title.trim(),
        title: title.trim(),
        due: due ? new Date(due).toISOString() : null,
        tags
      }

      await onSave(task.id, updates)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save task:", error)
      alert(`保存任务失败: ${error.message || "未知错误"}`)
    } finally {
      savingRef.current = false
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[70] w-full max-w-2xl rounded-2xl border border-border !bg-white dark:!bg-neutral-900 shadow-xl p-4 sm:p-6"
        aria-label="Edit task"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">编辑任务</DialogTitle>
          <DialogDescription>修改标题、截止日期和标签。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">任务标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如: 发送简历到周五 5pm"
              autoFocus
              className="h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="due">截止日期</Label>
            <Input
              id="due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如: work, urgent, project"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              用逗号分隔多个标签，如 work, urgent
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              取消
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
