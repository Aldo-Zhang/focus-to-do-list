# Frontend Lightning CSS 故障排除指南

## 问题描述

当 Tauri 开发环境在 macOS 上通过 Rosetta (darwin x64) 启动 Next.js 前端时，可能会遇到以下错误：

```
Cannot find module '../lightningcss.darwin-x64.node'
```

这个错误是因为 Next.js 使用 Lightning CSS 进行 CSS 处理，但缺少对应平台的原生绑定文件。

## 错误原因

- **平台不匹配**: Lightning CSS 需要与当前运行架构匹配的原生绑定文件
- **Rosetta 环境**: 在 Apple Silicon Mac 上通过 Rosetta 运行 x64 版本时，需要 `lightningcss-darwin-x64` 包
- **原生绑定缺失**: 核心 `lightningcss` 包已安装，但缺少平台特定的原生绑定

## 自动修复

我们的确保脚本会自动检测并修复这个问题：

### 1. 架构检测
脚本会自动检测当前运行环境：
- macOS ARM64: 安装 `lightningcss-darwin-arm64`
- macOS x64 (Rosetta): 安装 `lightningcss-darwin-x64`
- Linux x64: 安装 `lightningcss-linux-x64-gnu`
- Windows x64: 安装 `lightningcss-win32-x64-msvc`

### 2. 自动安装
脚本会：
1. 检查 `lightningcss` 核心包是否可解析
2. 验证对应的原生绑定文件是否存在
3. 如果缺失，自动安装正确的平台包

## 手动修复

如果自动修复失败，可以手动执行：

### 使用 pnpm (推荐)
```bash
cd frontend

# 对于 Rosetta (x64)
pnpm add -D lightningcss lightningcss-darwin-x64

# 对于原生 ARM64
pnpm add -D lightningcss lightningcss-darwin-arm64
```

### 使用 npm
```bash
cd frontend

# 对于 Rosetta (x64)
npm i -D lightningcss lightningcss-darwin-x64

# 对于原生 ARM64
npm i -D lightningcss lightningcss-darwin-arm64
```

### 一键修复脚本
```bash
cd frontend
npm run repair:lightningcss
```

## 后备方案

如果所有修复方法都失败，可以禁用 Lightning CSS：

### 1. 设置环境变量
在 `frontend/.env.local` 中添加：
```
NEXT_DISABLE_LIGHTNINGCSS=1
```

### 2. 重启开发服务器
```bash
cd frontend
npm run dev
```

## 验证修复

修复后，可以通过以下方式验证：

### 1. 检查包是否正确安装
```bash
cd frontend
node -e "console.log(require.resolve('lightningcss'))"
```

### 2. 检查原生绑定文件
```bash
cd frontend
ls node_modules/lightningcss/node/lightningcss.*.node
```

### 3. 启动开发服务器
```bash
cd frontend
npm run dev
```

## 常见问题

### Q: 为什么会出现这个错误？
A: 这是因为 Lightning CSS 使用 Rust 编写，需要平台特定的原生绑定文件。当在 Rosetta 环境下运行时，需要 x64 版本的原生绑定。

### Q: 如何确定当前运行的架构？
A: 运行 `node -p "process.platform + ' ' + process.arch"` 查看当前架构。

### Q: 禁用 Lightning CSS 会影响性能吗？
A: 是的，Lightning CSS 比默认的 CSS 处理器更快。建议优先修复而不是禁用。

### Q: 可以同时安装多个平台的原生绑定吗？
A: 可以，但会增加包大小。通常只需要当前运行平台的绑定。

## 相关链接

- [Lightning CSS 官方文档](https://lightningcss.dev/)
- [Next.js CSS 配置](https://nextjs.org/docs/app/building-your-application/styling/css-in-js)
- [Tauri 开发环境](https://tauri.app/v1/guides/development/overview/)
