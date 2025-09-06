"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ToolbarProps {
  filterBy: "all" | "due" | "no-due"
  onFilterChange: (filter: "all" | "due" | "no-due") => void
}

export function Toolbar({ filterBy, onFilterChange }: ToolbarProps) {
  const filterOptions = [
    { value: "all" as const, label: "All Tasks" },
    { value: "due" as const, label: "Only Due" },
    { value: "no-due" as const, label: "No Due Date" },
  ]

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            {filterOptions.find((f) => f.value === filterBy)?.label}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {filterOptions.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => onFilterChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
