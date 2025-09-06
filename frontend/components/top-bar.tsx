"use client"
import { Settings, Command, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopBarProps {
  onQuickAdd: (text: string) => void
  onOpenSettings: () => void
  onOpenCommandPalette: () => void
  onToggleSidebar: () => void
}

export function TopBar({ onQuickAdd, onOpenSettings, onOpenCommandPalette, onToggleSidebar }: TopBarProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="p-2">
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">FocusList</h1>
        <span className="text-sm text-muted-foreground">{today}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onOpenCommandPalette} className="p-2">
          <Command className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenSettings} className="p-2">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
