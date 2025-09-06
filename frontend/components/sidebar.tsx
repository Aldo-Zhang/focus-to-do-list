"use client"

import type { FilterType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: Record<FilterType, number>
  isCollapsed: boolean
  onToggleSidebar: () => void
}

export function Sidebar({ activeFilter, onFilterChange, counts, isCollapsed, onToggleSidebar }: SidebarProps) {
  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: "today", label: "Today", icon: "📅" },
    { key: "upcoming", label: "Upcoming", icon: "⏰" },
    { key: "someday", label: "Someday", icon: "💭" },
    { key: "all", label: "All", icon: "📋" },
    { key: "archived", label: "Archived", icon: "📦" },
  ]

  if (isCollapsed) {
    return null
  }

  return (
    <div className="w-60 bg-sidebar border-r border-sidebar-border p-4 flex flex-col gap-2">
      <div className="text-sm font-medium text-sidebar-foreground/70 mb-2">Lists</div>
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            activeFilter === filter.key
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              activeFilter === filter.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {counts[filter.key]}
          </span>
        </button>
      ))}
    </div>
  )
}
