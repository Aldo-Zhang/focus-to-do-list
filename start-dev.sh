#!/usr/bin/env bash
set -euo pipefail

# 获取脚本所在目录的绝对路径
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
SCRIPTS_DIR="$REPO_ROOT/scripts"

echo "🚀 Start FocusList (native arm64)"
echo "🧭 CWD: $(pwd)"
echo "📁 Repo Root: $REPO_ROOT"
echo "🧩 Node arch: $(node -p "process.platform + ' ' + process.arch" || echo 'unknown')"
echo "🔧 此脚本将自动处理后端依赖安装和启动问题"

# 检查是否为 arm64
if [ "$(node -p "process.arch" 2>/dev/null)" != "arm64" ]; then
  echo "❌ Node.js 不是 arm64 架构，请运行: arch -arm64 zsh"
  exit 1
fi

# 使用 pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo "📦 安装 pnpm 全局..."
  corepack enable || true
  npm i -g pnpm || true
fi

echo "📦 使用包管理器: pnpm"

# 确保前端 arm64 绑定（使用绝对路径）
echo "⚡ 确保前端 Lightning CSS arm64 环境..."
( cd "$FRONTEND_DIR" && node "$SCRIPTS_DIR/frontend-ensure-lightningcss.js" )

# 检查前端依赖
echo "📦 检查前端依赖..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 安装前端依赖..."
  pnpm install
else
  echo "✅ 前端依赖已安装"
fi

# 返回项目根目录
cd "$REPO_ROOT"

# 启动后端（如果未运行）
echo "🟢 检查后端服务..."
if ! lsof -i :4000 >/dev/null 2>&1; then
  echo "🟢 启动后端服务在 :4000 ..."
  
  # 检查后端依赖
  BACKEND_DIR="$REPO_ROOT/backend"
  echo "📦 检查后端依赖..."
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd "$BACKEND_DIR"
    npm install --legacy-peer-deps
    cd "$REPO_ROOT"
  else
    echo "✅ 后端依赖已安装"
  fi
  
  # 启动后端服务
  echo "🚀 启动后端服务..."
  ( cd "$BACKEND_DIR" && npm run dev ) &
  BACKEND_PID=$!
  echo "📝 后端进程 ID: $BACKEND_PID"
  
  # 等待后端启动
  echo "⏳ 等待后端启动..."
  for i in {1..15}; do
    if curl -s http://127.0.0.1:4000/health >/dev/null 2>&1; then
      echo "✅ 后端已启动"
      break
    fi
    echo "   尝试 $i/15..."
    sleep 2
  done
  
  # 验证后端是否真的启动
  if ! curl -s http://127.0.0.1:4000/health >/dev/null 2>&1; then
    echo "❌ 后端启动失败，请检查日志"
    echo "🔧 手动启动: cd backend && npm run dev"
    echo "🔧 或者: cd backend && node server.js"
  fi
else
  echo "✅ 后端已在运行"
fi

# 检查 Tauri 目录
if [ ! -d "src-tauri" ]; then
  echo "❌ 找不到 src-tauri 目录，请先运行 Tauri 初始化"
  exit 1
fi

# 确保 Tauri CLI
echo "🚀 确保 Tauri CLI 环境..."
if command -v tauri >/dev/null 2>&1; then
  echo "✅ 使用全局 tauri 命令"
  echo "🎯 启动 Tauri 开发环境..."
  echo "📱 这将启动桌面应用，包含前端和后端功能"
  echo ""
  tauri dev
elif pnpm exec tauri --version >/dev/null 2>&1; then
  echo "✅ 使用 pnpm exec tauri"
  echo "🎯 启动 Tauri 开发环境..."
  echo "📱 这将启动桌面应用，包含前端和后端功能"
  echo ""
  pnpm exec tauri dev
elif command -v cargo >/dev/null 2>&1; then
  echo "⚠️ 使用 cargo tauri 后备方案"
  echo "🎯 启动 Tauri 开发环境..."
  echo "📱 这将启动桌面应用，包含前端和后端功能"
  echo ""
  cargo tauri dev
else
  echo "❌ 找不到 tauri 或 cargo 命令"
  echo "🔧 请尝试："
  echo "   1. 安装 Tauri CLI: pnpm add -D @tauri-apps/cli"
  echo "   2. 安装 Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi