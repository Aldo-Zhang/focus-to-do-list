# FocusList - Intelligent Task Management Application

A modern, AI-powered task management application built with Tauri + Next.js + Node.js + SQLite, featuring automatic task archiving, intelligent task rewriting, and a clean, focused interface.

## 🚀 Quick Start

### Method 1: Using Enhanced Startup Script (Recommended)

```bash
# After cloning the project, simply run:
./start-dev.sh
```

This will automatically detect your architecture, install the correct Tauri CLI platform packages, and start the complete development environment.

### Method 2: Tauri Desktop App Development

```bash
# Start Tauri development environment (includes both frontend and backend)
npm run tauri:dev
```

### Method 3: Web Development Only

#### Start Backend
```bash
cd backend
npm install
npm run dev
```

Backend will run at http://localhost:4000

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will run at http://localhost:3000

## 🔧 Troubleshooting

### Tauri CLI Native Binding Error
If you encounter "Cannot find native binding" error:

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json && npm i && npm run tauri:dev

# Or use Cargo fallback
cargo tauri dev
```

### System Requirements
- **macOS**: Apple Silicon (arm64) or Intel (x64)
- **Xcode Command Line Tools**: `xcode-select --install`
- **Rust Toolchain**: Install via `rustup`
- **Node.js**: arm64 version

For detailed development guide, see [docs/dev.md](docs/dev.md)

## ✨ Key Features

### 🧠 AI-Powered Task Management
- **Intelligent Task Rewriting**: Uses Ollama with local LLM (llama3.1:latest) to automatically rewrite and enhance task descriptions
- **Smart Task Classification**: Automatically categorizes tasks by urgency and priority
- **Graceful Fallback**: Falls back to simple rewriting if Ollama is unavailable
- **Customizable Rules**: Define your own task rewriting rules in settings

### 📋 Advanced Task Management
- **Automatic Archiving**: Completed tasks are automatically archived and hidden from main lists
- **Smart Task Sorting**: Tasks are sorted by urgency, priority, and due dates
- **Task Filtering**: Filter by Today, Upcoming, Someday, All, or Archived tasks
- **Task Actions**: Edit, Pin, Archive/Restore, and Delete tasks
- **Real-time Updates**: All changes are reflected immediately across the interface

### 🎨 Modern User Interface
- **Clean Design**: Built with shadcn/ui components and Tailwind CSS
- **Dark Mode Support**: Automatic theme switching
- **Responsive Layout**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Cmd+N for quick task creation
- **Command Palette**: Quick access to all features

### ⚙️ Settings & Configuration
- **Ollama Configuration**: Set custom Ollama base URL and model
- **User Rules**: Define custom task rewriting rules
- **Show Completed Tasks**: Toggle visibility of completed tasks
- **Sidebar Management**: Collapsible sidebar for more screen space

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Hooks
- **Type Safety**: TypeScript
- **Icons**: Lucide React
- **Desktop**: Tauri (Rust + WebView)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **AI Integration**: Ollama (local LLM)
- **Middleware**: CORS, Body Parser

## 📊 Database Schema

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rawText TEXT NOT NULL,
  title TEXT NOT NULL,
  title_rewrite TEXT NOT NULL,
  due DATETIME,
  tags TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  urgency INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  pinned BOOLEAN DEFAULT 0,
  archived BOOLEAN DEFAULT 0
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ollamaBaseUrl TEXT DEFAULT 'http://localhost:11434',
  ollamaModel TEXT DEFAULT 'llama3.1:latest',
  userRules TEXT DEFAULT '',
  showCompleted BOOLEAN DEFAULT 0,
  sidebarCollapsed BOOLEAN DEFAULT 0,
  theme TEXT DEFAULT 'light'
);
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | Get all tasks (sorted by urgency) |
| POST | `/tasks` | Create new task |
| GET | `/tasks/:id` | Get specific task |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| PATCH | `/tasks/:id/toggle-complete` | Toggle task completion (auto-archives) |
| PATCH | `/tasks/:id/toggle-pin` | Toggle task pin status |
| PATCH | `/tasks/:id/toggle-archive` | Toggle task archive status |
| POST | `/ai/rewrite` | AI task rewriting |
| GET | `/ai/test` | Test AI connection |
| GET | `/settings` | Get application settings |
| PUT | `/settings` | Update application settings |
| POST | `/seed` | Seed database with sample data |

## 🎯 Task Management Logic

### Task Classification
Tasks are automatically classified into categories:

1. **Focus Now** (Urgent Tasks)
   - Overdue tasks
   - Tasks due today
   - Tasks due within 1 day
   - Maximum 4 tasks displayed

2. **Other Tasks**
   - Tasks without due dates
   - Tasks due more than 1 day away
   - Non-urgent tasks

3. **Archived Tasks**
   - Completed tasks (automatically archived)
   - Manually archived tasks
   - Hidden from main views by default

### Task Sorting Algorithm
Tasks are sorted by:
1. **Pinned status** (pinned tasks first)
2. **Urgency score** (computed from priority and time decay)
3. **Due date** (earlier dates first)
4. **Creation date** (newer tasks first)

### Automatic Archiving
- When a task is marked as completed, it's automatically archived
- Archived tasks are hidden from main task lists
- Archived tasks can be viewed in the "Archived" filter
- Archived tasks can be restored or permanently deleted

## 🛠️ Development

### Project Structure
```
focustodolist/
├── backend/                 # Node.js + Express backend
│   ├── server.js           # Main server file
│   ├── db.js               # Database management
│   ├── src/
│   │   └── services/
│   │       └── ai.js       # AI service integration
│   ├── package.json        # Backend dependencies
│   └── focuslist.db        # SQLite database
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx        # Main application page
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── sidebar.tsx     # Navigation sidebar
│   │   ├── task-list.tsx   # Task list component
│   │   ├── task-item.tsx   # Individual task component
│   │   ├── settings-modal.tsx # Settings interface
│   │   └── command-palette.tsx # Command palette
│   ├── lib/                # Utilities and types
│   │   ├── db.ts           # API client
│   │   ├── types.ts        # TypeScript types
│   │   ├── ai.ts           # AI utilities
│   │   └── task-utils.ts   # Task management utilities
│   └── package.json        # Frontend dependencies
├── src-tauri/              # Tauri desktop app
│   ├── src/
│   │   ├── main.rs         # Rust main file
│   │   └── lib.rs          # Rust library
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── docs/                   # Documentation
├── scripts/                # Build and setup scripts
└── start-dev.sh           # Development startup script
```

### Environment Requirements
- Node.js 18+
- npm or pnpm
- Rust (for Tauri)
- Ollama (optional, for AI features)

### Development Commands

```bash
# Start full development environment
./start-dev.sh

# Start only backend
cd backend && npm run dev

# Start only frontend
cd frontend && npm run dev

# Start Tauri desktop app
npm run tauri:dev

# Build for production
npm run build
npm run tauri:build
```

## 📝 Usage Guide

### Basic Task Management
1. **Add Task**: Type in the input field and press Enter
2. **Edit Task**: Click the "..." menu and select "Edit"
3. **Complete Task**: Click the circle on the left (auto-archives)
4. **Pin Task**: Click the "..." menu and select "Pin"
5. **Archive Task**: Click the "..." menu and select "Archive"
6. **Delete Task**: Click the "..." menu and select "Delete"

### Task Filtering
- **Today**: Tasks due today
- **Upcoming**: Tasks with future due dates
- **Someday**: Tasks without due dates
- **All**: All active tasks
- **Archived**: Completed and archived tasks

### Settings Configuration
1. Open settings (gear icon in top bar)
2. Configure Ollama settings:
   - Base URL (default: http://localhost:11434)
   - Model name (default: llama3.1:latest)
3. Set custom task rewriting rules
4. Toggle completed task visibility
5. Manage sidebar state

### AI Features
- Tasks are automatically rewritten using local LLM
- Custom rules can be defined for task enhancement
- Graceful fallback if AI service is unavailable
- Test AI connection in settings

## 🔧 Configuration

### Backend Configuration
- **Port**: 4000
- **Database**: SQLite (focuslist.db)
- **CORS**: Enabled for localhost:3000
- **AI Service**: Ollama integration

### Frontend Configuration
- **Port**: 3000
- **API Base URL**: http://localhost:4000
- **Theme**: Light/Dark mode support

### Tauri Configuration
- **Platform**: macOS, Windows, Linux
- **Bundle**: Native desktop application
- **Security**: Sandboxed environment

## 🚀 Deployment

### Desktop Application
```bash
# Build for current platform
npm run tauri:build

# Build for specific platform
npm run tauri:build -- --target x86_64-apple-darwin
```

### Web Application
```bash
# Build frontend
cd frontend && npm run build

# Start production server
cd frontend && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Ollama](https://ollama.ai/) - Local LLM platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework