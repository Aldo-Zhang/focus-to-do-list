# FocusList 开发指南

## 系统要求

- **macOS**: 支持 Apple Silicon (arm64) 和 Intel (x64)
- **Xcode Command Line Tools**: `xcode-select --install`
- **Rust 工具链**: 通过 `rustup` 安装
- **Node.js**: arm64 版本 (推荐使用 nvm 管理版本)

## 快速开始

### 一键启动开发环境
```bash
./start-dev.sh
```

### 手动启动步骤
```bash
# 1. 安装依赖
npm install

# 2. 启动 Tauri 开发环境
npm run tauri:dev
```

## 故障排除

### 清理并重新安装
如果遇到 Tauri CLI native binding 错误：
```bash
rm -rf node_modules package-lock.json && npm i && npm run tauri:dev
```

### 使用 Cargo 后备方案
如果 npm 方式失败，可以直接使用 Cargo：
```bash
cargo tauri dev
```

### 检查环境
```bash
# 检查 Rust 工具链
rustup show

# 检查 Node.js 版本
node --version

# 检查架构
node -p "process.platform + ' ' + process.arch"
```

## 项目结构

```
focuslist/
├── frontend/          # Next.js 前端
├── src-tauri/         # Tauri 后端
├── scripts/           # 构建脚本
│   └── tauri-ensure-cli.js  # Tauri CLI 环境确保脚本
├── start-dev.sh       # 开发环境启动脚本
└── package.json       # 根级包管理
```

## 开发脚本

- `npm run dev`: 仅启动前端开发服务器
- `npm run tauri:dev`: 启动完整的 Tauri 开发环境
- `npm run tauri:build`: 构建 Tauri 应用
- `npm run pretauri:dev`: 确保 Tauri CLI 环境正确

## 常见问题

### Q: "Cannot find native binding" 错误
A: 运行 `npm run pretauri:dev` 或使用上述清理重装命令

### Q: 前端样式不显示
A: 确保在 frontend 目录运行 `npm run dev` 并检查 Tailwind 配置

### Q: 后端 API 连接失败
A: 检查 `frontend/.env.local` 中的 `NEXT_PUBLIC_API_URL` 设置
