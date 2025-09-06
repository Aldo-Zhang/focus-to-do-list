"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface Command {
  id: string
  label: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNewTask: () => void
  onToggleTodayFilter: () => void
  onOpenSettings: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  onNewTask,
  onToggleTodayFilter,
  onOpenSettings,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")

  const commands: Command[] = [
    {
      id: "new-task",
      label: "New task",
      action: () => {
        onNewTask()
        onClose()
      },
    },
    {
      id: "toggle-today",
      label: "Toggle Today filter",
      action: () => {
        onToggleTodayFilter()
        onClose()
      },
    },
    {
      id: "open-settings",
      label: "Open Settings",
      action: () => {
        onOpenSettings()
        onClose()
      },
    },
  ]

  const filteredCommands = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!isOpen) {
      setQuery("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No commands found</div>
          ) : (
            filteredCommands.map((command) => (
              <button
                key={command.id}
                onClick={command.action}
                className="w-full px-4 py-3 text-left text-sm hover:bg-accent transition-colors"
              >
                {command.label}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
