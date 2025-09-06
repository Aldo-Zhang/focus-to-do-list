const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    const dbPath = process.env.DB_PATH || 'focuslist.db';
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    // 创建 tasks 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rawText TEXT NOT NULL,
        title TEXT NOT NULL,
        title_rewrite TEXT NOT NULL,
        due TEXT NULL,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        urgency INTEGER NOT NULL DEFAULT 1,
        completed BOOLEAN NOT NULL DEFAULT 0,
        pinned BOOLEAN NOT NULL DEFAULT 0,
        archived BOOLEAN NOT NULL DEFAULT 0
      )
    `);

    // 创建 settings 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // 迁移现有数据（添加新字段）
    this.migrateData();

    // 检查是否需要种子数据
    const count = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    if (count.count === 0) {
      this.seedData();
    }

    // 初始化默认设置
    this.initSettings();
  }

  migrateData() {
    // 检查是否需要添加新字段
    const tableInfo = this.db.prepare("PRAGMA table_info(tasks)").all();
    const hasUpdatedAt = tableInfo.some(col => col.name === 'updatedAt');
    const hasCompleted = tableInfo.some(col => col.name === 'completed');
    const hasPinned = tableInfo.some(col => col.name === 'pinned');
    const hasArchived = tableInfo.some(col => col.name === 'archived');

    if (!hasUpdatedAt || !hasCompleted || !hasPinned || !hasArchived) {
      console.log('🔄 迁移数据库结构...');
      
      if (!hasUpdatedAt) {
        this.db.exec("ALTER TABLE tasks ADD COLUMN updatedAt TEXT");
        // 为现有记录设置 updatedAt
        this.db.exec("UPDATE tasks SET updatedAt = createdAt WHERE updatedAt IS NULL");
      }
      
      if (!hasCompleted) {
        this.db.exec("ALTER TABLE tasks ADD COLUMN completed BOOLEAN DEFAULT 0");
      }
      
      if (!hasPinned) {
        this.db.exec("ALTER TABLE tasks ADD COLUMN pinned BOOLEAN DEFAULT 0");
      }
      
      if (!hasArchived) {
        this.db.exec("ALTER TABLE tasks ADD COLUMN archived BOOLEAN DEFAULT 0");
      }
    }
  }

  initSettings() {
    const defaultSettings = [
      { key: 'ollamaBaseUrl', value: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434' },
      { key: 'ollamaModel', value: process.env.OLLAMA_MODEL || 'llama3.1:latest' },
      { key: 'userRules', value: '' }
    ];

    const now = new Date().toISOString();
    
    for (const setting of defaultSettings) {
      const existing = this.db.prepare('SELECT id FROM settings WHERE key = ?').get(setting.key);
      if (!existing) {
        this.db.prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)')
          .run(setting.key, setting.value, now);
      }
    }
  }

  seedData() {
    const now = new Date();
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const seedTasks = [
      {
        rawText: 'Call insurance to update RX',
        title: 'Call insurance to update RX',
        title_rewrite: 'Call insurance to update RX',
        due: yesterday.toISOString(),
        tags: 'health,urgent',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 3
      },
      {
        rawText: '30-min workout',
        title: '30-min workout',
        title_rewrite: '30-min workout',
        due: today.toISOString(),
        tags: 'fitness,health',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        urgency: 2
      },
      {
        rawText: 'Review job offer from startup',
        title: 'Review job offer from startup',
        title_rewrite: 'Review job offer from startup',
        due: today.toISOString(),
        tags: 'work,important',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        urgency: 2
      },
      {
        rawText: 'Send resume by Friday 2pm',
        title: 'Send resume by Friday 2pm',
        title_rewrite: 'Send resume by Friday 2pm',
        due: tomorrow.toISOString(),
        tags: 'work,career',
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        urgency: 1
      },
      {
        rawText: 'Book dentist appointment this month',
        title: 'Book dentist appointment this month',
        title_rewrite: 'Book dentist appointment this month',
        due: nextWeek.toISOString(),
        tags: 'health,appointment',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 0
      },
      {
        rawText: 'Study LLM paper (no hard deadline)',
        title: 'Study LLM paper (no hard deadline)',
        title_rewrite: 'Study LLM paper (no hard deadline)',
        due: null,
        tags: 'learning,research',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 0
      },
      {
        rawText: '提交项目报告',
        title: '提交项目报告',
        title_rewrite: '提交项目报告',
        due: tomorrow.toISOString(),
        tags: 'work,project',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 1
      },
      {
        rawText: 'Dinner with friends',
        title: 'Dinner with friends',
        title_rewrite: 'Dinner with friends',
        due: nextWeek.toISOString(),
        tags: 'social,fun',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 0
      }
    ];

    const insert = this.db.prepare(`
      INSERT INTO tasks (rawText, title, title_rewrite, due, tags, createdAt, updatedAt, urgency, completed, pinned, archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const task of seedTasks) {
      insert.run(
        task.rawText,
        task.title,
        task.title_rewrite,
        task.due,
        task.tags,
        task.createdAt,
        task.createdAt, // updatedAt same as createdAt for seed data
        task.urgency,
        false, // completed
        false, // pinned
        false  // archived
      );
    }

    console.log('✅ 种子数据已插入');
  }

  getAllTasks() {
    const tasks = this.db.prepare('SELECT * FROM tasks ORDER BY id DESC').all();
    return tasks.map(this.mapTaskToAPI);
  }

  getTaskById(id) {
    const task = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return task ? this.mapTaskToAPI(task) : null;
  }

  createTask(taskData) {
    const { rawText, title, due, tags, urgency, completed = false, pinned = false, archived = false } = taskData;
    const now = new Date().toISOString();
    const finalTitle = title || rawText;
    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || '');
    const finalUrgency = urgency !== undefined ? urgency : 1;

    const insert = this.db.prepare(`
      INSERT INTO tasks (rawText, title, title_rewrite, due, tags, createdAt, updatedAt, urgency, completed, pinned, archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(rawText, finalTitle, finalTitle, due, tagsString, now, now, finalUrgency, completed ? 1 : 0, pinned ? 1 : 0, archived ? 1 : 0);
    return this.getTaskById(result.lastInsertRowid);
  }

  updateTask(id, updates) {
    const allowedFields = ['rawText', 'title', 'title_rewrite', 'due', 'tags', 'urgency', 'completed', 'pinned', 'archived'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        if (key === 'tags' && Array.isArray(value)) {
          values.push(value.join(','));
        } else if (key === 'completed' || key === 'pinned' || key === 'archived') {
          // 将布尔值转换为整数，因为 SQLite3 不能直接绑定布尔值
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      return this.getTaskById(id);
    }

    // 确保 title 和 title_rewrite 保持一致
    if (updates.title && !updates.title_rewrite) {
      updateFields.push('title_rewrite = ?');
      values.push(updates.title);
    }

    // 添加 updatedAt
    updateFields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const update = this.db.prepare(`
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    update.run(...values);
    return this.getTaskById(id);
  }

  deleteTask(id) {
    const deleteStmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = deleteStmt.run(id);
    return result.changes > 0;
  }

  mapTaskToAPI(task) {
    return {
      id: task.id.toString(),
      rawText: task.rawText,
      title: task.title,
      title_rewrite: task.title_rewrite,
      due: task.due,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      status: task.completed ? 'completed' : 'todo',
      priority_ai: task.urgency,
      priority_user: null,
      score: 0, // 将在排序时计算
      tags: task.tags ? task.tags.split(',').map(t => t.trim()) : [],
      pinned: Boolean(task.pinned),
      completed: Boolean(task.completed),
      archived: Boolean(task.archived)
    };
  }

  // 设置管理方法
  getSettings() {
    const settings = this.db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  updateSettings(settings) {
    const now = new Date().toISOString();
    const update = this.db.prepare('INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)');
    
    for (const [key, value] of Object.entries(settings)) {
      update.run(key, value, now);
    }
    
    return this.getSettings();
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;
