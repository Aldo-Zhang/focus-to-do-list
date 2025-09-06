"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSettings, updateSettings, testAIConnection } from "@/lib/db"
import type { Settings } from "@/lib/db"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  showCompleted,
  onShowCompletedChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "rules" | "general">("general")
  const [aiSettings, setAiSettings] = useState<Settings>({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "llama3.1:latest",
    userRules: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  // 确保设置模态框背景在明暗模式下都是实色
  useEffect(() => {
    if (!isOpen) return
    
    const dialogContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement
    if (dialogContent) {
      const isDark = document.documentElement.classList.contains('dark')
      dialogContent.style.backgroundColor = isDark ? '#171717' : '#ffffff'
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const settings = await getSettings()
      setAiSettings(settings)
      setConnectionStatus("unknown") // Reset connection status when loading
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      await updateSettings(aiSettings)
      // Show success message
      const successMessage = activeTab === "ai" ? "AI 设置已保存" : 
                           activeTab === "rules" ? "规则已保存" : "设置已保存"
      alert(successMessage)
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      alert(`保存设置失败: ${error.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      const connected = await testAIConnection()
      setConnectionStatus(connected ? "connected" : "disconnected")
    } catch (error) {
      console.error("Failed to test connection:", error)
      setConnectionStatus("disconnected")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const tabs = [
    { id: "ai" as const, label: "AI" },
    { id: "rules" as const, label: "Rules" },
    { id: "general" as const, label: "General" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl z-50 !bg-white dark:!bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex">
          <div className="w-32 border-r border-border pr-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 pl-6">
            {activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ollama Base URL</label>
                  <input
                    type="url"
                    value={aiSettings.ollamaBaseUrl}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, ollamaBaseUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    placeholder="http://127.0.0.1:11434"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ollama Model</label>
                  <input
                    type="text"
                    value={aiSettings.ollamaModel}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    placeholder="llama3.1:latest"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium">Connection Status</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {connectionStatus === "connected" && "✅ Connected to Ollama"}
                    {connectionStatus === "disconnected" && "❌ Cannot connect to Ollama"}
                    {connectionStatus === "unknown" && "⏳ Click 'Test Connection' to check"}
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save AI Settings"}
                </Button>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">User Rules for AI Rewriting</label>
                  <textarea
                    value={aiSettings.userRules}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, userRules: e.target.value }))}
                    className="w-full h-40 px-3 py-2 border border-input rounded-lg bg-background font-mono text-sm"
                    placeholder="Define your custom rules for task rewriting and classification..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    These rules will be passed to the AI model to customize how it rewrites and classifies your tasks.
                  </p>
                </div>
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Rules"}
                </Button>
              </div>
            )}

            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Theme</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={theme === "light"}
                        onChange={() => onThemeChange("light")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Light</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={theme === "dark"}
                        onChange={() => onThemeChange("dark")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Dark</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => onShowCompletedChange(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Show completed tasks</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
