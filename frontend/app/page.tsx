"use client"

import { useState, useEffect } from "react"
import type { Task, FilterType } from "@/lib/db"
import { rewriteAndClassify } from "@/lib/ai"
import { sortTasks } from "@/lib/task-utils"
import { isToday, daysUntil, isOverdue } from "@/lib/utils-date"
import { 
  listTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  toggleTaskComplete, 
  toggleTaskPin,
  toggleTaskArchive,
  rewriteTask,
  getSettings,
  seedDatabase
} from "@/lib/db"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { TaskList } from "@/components/task-list"
import { SettingsModal } from "@/components/settings-modal"
import { CommandPalette } from "@/components/command-palette"
import { EditTaskDialog } from "@/components/EditTaskDialog"

const SETTINGS_KEY = "focuslist-settings"

interface Settings {
  theme: "light" | "dark"
  showCompleted: boolean
  sidebarCollapsed: boolean
}

export default function FocusListApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    showCompleted: false, // 默认隐藏已完成的任务
    sidebarCollapsed: false,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading tasks...")
        // Load tasks from database
        const tasks = await listTasks()
        console.log("Loaded tasks:", tasks)
        setTasks(tasks)
        
        // If no tasks exist, seed the database
        if (tasks.length === 0) {
          console.log("No tasks found, seeding database...")
          await seedDatabase()
          const seededTasks = await listTasks()
          console.log("Seeded tasks:", seededTasks)
          setTasks(seededTasks)
        }
      } catch (error) {
        console.error("Failed to load tasks:", error)
        // Show error to user
        alert(`Failed to load tasks: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Fallback to empty array if database fails
        setTasks([])
      }
    }

    loadData()

    // Load settings from localStorage
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings({
        theme: parsed.theme || "light",
        showCompleted: parsed.showCompleted ?? true,
        sidebarCollapsed: parsed.sidebarCollapsed ?? false,
      })
    }
  }, [])

  // Tasks are now persisted in database, no need for localStorage

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))

    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault()
        focusQuickAdd()
      } else if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const focusQuickAdd = () => {
    const input = document.querySelector('input[name="task"]') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }

  const handleQuickAdd = async (text: string) => {
    try {
      console.log("Creating task with text:", text)
      
      // 获取用户设置
      const settings = await getSettings()
      console.log("Settings:", settings)
      
      // 使用 AI 重写任务
      let rewriteResult
      try {
        rewriteResult = await rewriteTask(text, settings.userRules)
        console.log("AI rewrite result:", rewriteResult)
      } catch (aiError) {
        console.warn("AI rewrite failed, using fallback:", aiError)
        // 使用本地重写作为后备
        const classified = rewriteAndClassify(text)
        rewriteResult = {
          title: classified.rewrite,
          tags: classified.tags,
          urgency: classified.priority,
          due: classified.dueISO
        }
        console.log("Fallback rewrite result:", rewriteResult)
      }

      const taskPayload = {
        rawText: text,
        title: rewriteResult.title,
        due: rewriteResult.due,
        tags: rewriteResult.tags,
        urgency: rewriteResult.urgency,
      }
      console.log("Task payload:", taskPayload)

      const newTask = await createTask(taskPayload)
      console.log("Created task:", newTask)
      
      setTasks((prev) => {
        const updated = [newTask, ...prev]
        console.log("Updated tasks list:", updated)
        return updated
      })
    } catch (error: unknown) {
      console.error("Failed to create task:", error)
      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`创建任务失败: ${errorMessage}`)
    }
  }

  const handleToggleComplete = async (id: string) => {
    try {
      const updatedTask = await toggleTaskComplete(id)
      if (updatedTask) {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updatedTask : task))
        )
      }
    } catch (error: unknown) {
      console.error("Failed to toggle task completion:", error)
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`切换任务状态失败: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((task) => task.id !== id))
    } catch (error: unknown) {
      console.error("Failed to delete task:", error)
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`删除任务失败: ${errorMessage}`)
    }
  }

  const handleEdit = async (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await updateTask(id, updates)
      if (updatedTask) {
        setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)))
      }
    } catch (error: unknown) {
      console.error("Failed to update task:", error)
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`更新任务失败: ${errorMessage}`)
    }
  }

  const handleTogglePin = async (id: string) => {
    try {
      const updatedTask = await toggleTaskPin(id)
      if (updatedTask) {
        setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)))
      }
    } catch (error: unknown) {
      console.error("Failed to toggle task pin:", error)
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`切换置顶状态失败: ${errorMessage}`)
    }
  }

  const handleToggleArchive = async (id: string) => {
    try {
      const updatedTask = await toggleTaskArchive(id)
      if (updatedTask) {
        setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)))
      }
    } catch (error: unknown) {
      console.error("Failed to toggle task archive:", error)
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`切换归档状态失败: ${errorMessage}`)
    }
  }


  const handleToggleSidebar = () => {
    setSettings((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }))
  }

  const handleEditClick = (task: Task) => {
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false)
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter((task) => {
    // 如果当前查看归档任务，只显示已归档的任务
    if (activeFilter === "archived") {
      return task.archived
    }

    // 对于非归档视图，隐藏已归档的任务
    if (task.archived) {
      return false
    }

    // 如果设置中不显示已完成的任务，则隐藏已完成的任务
    if (!settings.showCompleted && task.completed) {
      return false
    }

    switch (activeFilter) {
      case "today":
        return task.due && isToday(task.due)
      case "upcoming":
        return task.due && !isToday(task.due) && daysUntil(task.due) >= 0
      case "someday":
        return !task.due
      case "all":
      default:
        return true
    }
  })

  // 调试信息
  console.log("All tasks:", tasks)
  console.log("Filtered tasks:", filteredTasks)
  console.log("Active filter:", activeFilter)
  console.log("Settings:", settings)

  const sortedTasks = sortTasks(filteredTasks)

  const urgentTasks = activeFilter === "archived" 
    ? [] // 归档视图中不显示紧急任务
    : sortedTasks
        .filter((task) => {
          if (!task.due) return false
          return isOverdue(task.due) || isToday(task.due) || daysUntil(task.due) <= 1
        })
        .slice(0, 4) // Show max 4 urgent tasks

  const nonUrgentTasks = activeFilter === "archived"
    ? sortedTasks // 归档视图中显示所有归档任务
    : sortedTasks.filter((task) => {
        if (!task.due) return true
        return !isOverdue(task.due) && !isToday(task.due) && daysUntil(task.due) > 1
      })

  const counts: Record<FilterType, number> = {
    today: tasks.filter((t) => t.due && isToday(t.due) && !t.completed && !t.archived).length,
    upcoming: tasks.filter((t) => t.due && !isToday(t.due) && daysUntil(t.due) >= 0 && !t.completed && !t.archived).length,
    someday: tasks.filter((t) => !t.due && !t.completed && !t.archived).length,
    all: tasks.filter((t) => !t.completed && !t.archived).length,
    archived: tasks.filter((t) => t.archived).length,
  }

  const handleToggleTodayFilter = () => {
    setActiveFilter(activeFilter === "today" ? "all" : "today")
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        onQuickAdd={handleQuickAdd}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
          isCollapsed={settings.sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6 max-w-2xl mx-auto w-full">
            {/* Prominent Quick Add Input */}
            <div className="w-full mb-8">
              <div className="relative">
                <input
                  name="task"
                  type="text"
                  placeholder="Add a task... (e.g., 'Send resume by Fri 5pm')"
                  className="w-full px-6 py-4 text-lg rounded-xl border-2 border-muted-foreground/20 focus:border-primary focus:outline-none bg-card shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        handleQuickAdd(input.value.trim())
                        input.value = ""
                      }
                    }
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⌘N</div>
              </div>
            </div>

            {/* Urgent Tasks Section */}
            {urgentTasks.length > 0 && activeFilter !== "archived" && (
              <div className="w-full mb-8">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Focus Now</h2>
                <TaskList
                  tasks={urgentTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onEditClick={handleEditClick}
                  isUrgent={true}
                />
              </div>
            )}

            {/* Non-Urgent Tasks Section */}
            {nonUrgentTasks.length > 0 && (
              <div className="w-full">
                <h2 className="text-sm font-medium mb-3 text-muted-foreground">
                  {activeFilter === "archived" ? "Archived Tasks" : "Other Tasks"}
                </h2>
                <TaskList
                  tasks={nonUrgentTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onEditClick={handleEditClick}
                  isUrgent={false}
                />
              </div>
            )}

            {/* Empty State */}
            {urgentTasks.length === 0 && nonUrgentTasks.length === 0 && (
              <div className="text-center text-muted-foreground mt-12">
                <p className="text-lg mb-2">
                  {activeFilter === "archived" ? "No archived tasks" : "All caught up!"}
                </p>
                <p className="text-sm">
                  {activeFilter === "archived" 
                    ? "Completed tasks will appear here automatically." 
                    : "Add a task above to get started."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={settings.theme}
        onThemeChange={(theme) => setSettings((prev) => ({ ...prev, theme }))}
        showCompleted={settings.showCompleted}
        onShowCompletedChange={(showCompleted) => setSettings((prev) => ({ ...prev, showCompleted }))}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewTask={focusQuickAdd}
        onToggleTodayFilter={handleToggleTodayFilter}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        task={editingTask}
        onSave={handleEdit}
      />
    </div>
  )
}
