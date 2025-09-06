# FocusList - 专注任务管理应用

一个现代化的任务管理应用，使用 React + Next.js + shadcn/ui 前端和 Node.js + Express + SQLite 后端。

## 🚀 快速开始

### 方法一：使用强化启动脚本（推荐）

```bash
# 克隆项目后，直接运行
./start-dev.sh
```

这将自动检测架构、安装正确的 Tauri CLI 平台包并启动完整的开发环境。

### 方法二：Tauri 桌面应用开发

```bash
# 启动 Tauri 开发环境（包含前端和后端）
npm run tauri:dev
```

### 方法三：仅 Web 开发

#### 启动后端
```bash
cd backend
npm install
npm run dev
```

后端将在 http://localhost:4000 运行

#### 启动前端
```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:3000 运行

## 🔧 故障排除

### Tauri CLI Native Binding 错误
如果遇到 "Cannot find native binding" 错误：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json && npm i && npm run tauri:dev

# 或使用 Cargo 后备方案
cargo tauri dev
```

### 系统要求
- **macOS**: Apple Silicon (arm64) 或 Intel (x64)
- **Xcode Command Line Tools**: `xcode-select --install`
- **Rust 工具链**: 通过 `rustup` 安装
- **Node.js**: arm64 版本

详细开发指南请参考 [docs/dev.md](docs/dev.md)

## 📋 功能特性

### 前端功能
- ✅ 现代化的 React + Next.js 应用
- ✅ 使用 shadcn/ui 组件库
- ✅ 响应式设计，支持深色模式
- ✅ 实时任务管理
- ✅ 智能任务排序（紧急任务优先）
- ✅ 键盘快捷键支持（Cmd+N 快速添加任务）
- ✅ 任务编辑、删除、置顶功能

### 后端功能
- ✅ RESTful API 设计
- ✅ SQLite 数据库存储
- ✅ 智能任务排序算法
- ✅ CORS 支持
- ✅ 错误处理和验证
- ✅ 示例数据自动插入

## 🏗️ 技术栈

### 前端
- **框架**: Next.js 14
- **UI 库**: shadcn/ui + Tailwind CSS
- **状态管理**: React Hooks
- **类型安全**: TypeScript
- **图标**: Lucide React

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite3
- **中间件**: CORS, Body Parser

## 📊 数据库架构

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rawText TEXT NOT NULL,
  title TEXT NOT NULL,
  due DATETIME,
  tags TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  urgency INTEGER DEFAULT 0
);
```

## 🔌 API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/tasks` | 获取所有任务（按紧急程度排序） |
| POST | `/tasks` | 创建新任务 |
| PUT | `/tasks/:id` | 更新任务 |
| DELETE | `/tasks/:id` | 删除任务 |

## 🎯 任务排序逻辑

任务按以下优先级排序：

1. **已过期任务** (urgency = 3) - 最高优先级
2. **今天到期** (urgency = 2) - 第二优先级  
3. **3天内到期** (urgency = 1) - 第三优先级
4. **无截止日期** (urgency = 0) - 最低优先级

## 🛠️ 开发

### 项目结构
```
focustodolist/
├── backend/           # Node.js + Express 后端
│   ├── server.js      # 主服务器文件
│   ├── package.json   # 后端依赖
│   └── focuslist.db   # SQLite 数据库
├── frontend/          # Next.js 前端
│   ├── app/           # Next.js App Router
│   ├── components/    # React 组件
│   ├── hooks/         # 自定义 Hooks
│   ├── lib/           # 工具函数和类型
│   └── package.json   # 前端依赖
└── start-dev.sh       # 开发环境启动脚本
```

### 环境要求
- Node.js 18+
- npm 或 pnpm

## 📝 使用说明

1. **添加任务**: 在顶部输入框中输入任务描述，按回车添加
2. **编辑任务**: 双击任务标题进行编辑
3. **完成任务**: 点击任务左侧的圆圈标记
4. **删除任务**: 点击任务右侧的菜单按钮选择删除
5. **置顶任务**: 在任务菜单中点击置顶按钮

## 🔧 配置

### 后端配置
- 端口: 4000
- 数据库: SQLite (focuslist.db)
- CORS: 已启用

### 前端配置
- 端口: 3000
- API 基础 URL: http://localhost:4000

## 📄 许可证

MIT License
