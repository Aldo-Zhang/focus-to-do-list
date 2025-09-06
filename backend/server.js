require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DatabaseManager = require('./db');
const { aiService } = require('./src/services/ai');

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(cors({ 
  origin: ['http://localhost:3000', 'tauri://localhost'],
  credentials: true
}));
app.use(express.json());

// 数据库连接
const db = new DatabaseManager();

// 排序分数计算函数
function computeSortingScore(task) {
  const now = new Date();
  let score = 0;

  // 基础分数：urgency 值
  score += task.priority_ai * 1000;

  // 截止日期处理
  if (task.due) {
    const dueDate = new Date(task.due);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff < 0) {
      // 已过期：越久过期分数越高
      score += 10000 + Math.abs(daysDiff) * 100;
    } else if (daysDiff <= 1) {
      // 24小时内到期：高优先级
      score += 5000 + (1 - daysDiff) * 1000;
    } else if (daysDiff <= 7) {
      // 一周内到期：中等优先级
      score += 2000 + (7 - daysDiff) * 100;
    } else {
      // 未来任务：低优先级
      score += 1000 - daysDiff;
    }
  } else {
    // 无截止日期：最低优先级
    score += 100;
  }

  // 创建时间：越早创建分数越高（用于 tie-breaker）
  const createdAt = new Date(task.created_at);
  score += (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  return score;
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 获取所有任务（按排序分数排序）
app.get('/tasks', (req, res) => {
  try {
    const tasks = db.getAllTasks();
    
    // 计算排序分数并排序
    const tasksWithScore = tasks.map(task => ({
      ...task,
      score: computeSortingScore(task)
    }));

    // 按分数降序，然后按创建时间升序
    tasksWithScore.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    res.json({ tasks: tasksWithScore });
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 获取单个任务
app.get('/tasks/:id', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }
    res.json({ task });
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 创建任务
app.post('/tasks', (req, res) => {
  try {
    const { rawText, title, due, tags, urgency } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText 是必填字段' });
    }

    const task = db.createTask({
      rawText,
      title,
      due,
      tags,
      urgency
    });

    res.json({ task });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// 更新任务
app.patch('/tasks/:id', (req, res) => {
  try {
    const task = db.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }
    res.json({ task });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ error: '更新任务失败' });
  }
});

// 切换任务完成状态
app.patch('/tasks/:id/toggle-complete', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }

    const newCompleted = !task.completed;
    const updates = { 
      completed: newCompleted
    };

    // 如果任务被标记为完成，同时将其归档
    if (newCompleted) {
      updates.archived = true;
    }

    const updatedTask = db.updateTask(req.params.id, updates);
    res.json({ task: updatedTask });
  } catch (error) {
    console.error('切换任务完成状态失败:', error);
    res.status(500).json({ error: '切换任务完成状态失败' });
  }
});

// 切换任务置顶状态
app.patch('/tasks/:id/toggle-pin', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }

    const updatedTask = db.updateTask(req.params.id, { 
      pinned: !task.pinned 
    });
    res.json({ task: updatedTask });
  } catch (error) {
    console.error('切换任务置顶状态失败:', error);
    res.status(500).json({ error: '切换任务置顶状态失败' });
  }
});

// 切换任务归档状态
app.patch('/tasks/:id/toggle-archive', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任务未找到' });
    }

    const updatedTask = db.updateTask(req.params.id, { 
      archived: !task.archived 
    });
    res.json({ task: updatedTask });
  } catch (error) {
    console.error('切换任务归档状态失败:', error);
    res.status(500).json({ error: '切换任务归档状态失败' });
  }
});

// 删除任务
app.delete('/tasks/:id', (req, res) => {
  try {
    const success = db.deleteTask(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '任务未找到' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

// AI 重写功能
app.post('/ai/rewrite', async (req, res) => {
  try {
    const { rawText, userRules } = req.body;
    
    if (!rawText) {
      return res.status(400).json({ error: 'rawText 是必填字段' });
    }

    const result = await aiService.rewriteTask(rawText, userRules);
    res.json(result);
  } catch (error) {
    console.error('AI 重写失败:', error);
    res.status(500).json({ error: 'AI 重写失败: ' + error.message });
  }
});

// 测试 AI 连接
app.get('/ai/test', async (req, res) => {
  try {
    const isConnected = await aiService.testConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('AI 连接测试失败:', error);
    res.status(500).json({ error: 'AI 连接测试失败: ' + error.message });
  }
});

// 种子数据端点
app.post('/seed', (req, res) => {
  try {
    db.seedData();
    res.json({ message: '种子数据已插入' });
  } catch (error) {
    console.error('种子数据插入失败:', error);
    res.status(500).json({ error: '种子数据插入失败' });
  }
});

// NLP 重写功能（保持向后兼容）
app.post('/nlp/rewrite', (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'input 是必填字段' });
    }

    const result = rewriteAndClassify(input);
    res.json(result);
  } catch (error) {
    console.error('NLP 重写失败:', error);
    res.status(500).json({ error: 'NLP 重写失败' });
  }
});

// 简单的关键词启发式重写
function rewriteAndClassify(input) {
  const text = input.toLowerCase();
  let urgency = 1; // 默认中等优先级
  const tags = [];

  // 工作相关关键词
  if (/\b(job|offer|recruiter|resume|oa|interview|career|work|project|report|deadline)\b/.test(text)) {
    urgency = Math.min(urgency + 1, 3);
    tags.push('work');
  }

  // 健康相关关键词
  if (/\b(doctor|rx|insurance|medical|health|appointment|dentist|hospital)\b/.test(text)) {
    urgency = Math.min(urgency + 1, 3);
    tags.push('health');
  }

  // 社交相关关键词
  if (/\b(dinner|party|hangout|social|friends|meeting|date)\b/.test(text)) {
    urgency = Math.max(urgency - 1, 0);
    tags.push('social');
  }

  // 学习相关关键词
  if (/\b(study|learn|research|paper|course|education|training)\b/.test(text)) {
    tags.push('learning');
  }

  // 健身相关关键词
  if (/\b(workout|exercise|gym|fitness|run|walk|sport)\b/.test(text)) {
    tags.push('fitness');
  }

  // 时间相关关键词
  if (/\b(urgent|asap|immediately|today|tomorrow|friday|monday)\b/.test(text)) {
    urgency = Math.min(urgency + 1, 3);
  }

  return {
    title: input,
    tags,
    urgency: Math.max(0, Math.min(3, urgency))
  };
}

// 兼容性路由
app.get('/api/tasks', (req, res) => {
  req.url = '/tasks';
  app._router.handle(req, res);
});

app.post('/api/tasks', (req, res) => {
  req.url = '/tasks';
  app._router.handle(req, res);
});

app.patch('/api/tasks/:id', (req, res) => {
  req.url = `/tasks/${req.params.id}`;
  app._router.handle(req, res);
});

app.delete('/api/tasks/:id', (req, res) => {
  req.url = `/tasks/${req.params.id}`;
  app._router.handle(req, res);
});

// 设置管理
app.get('/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ error: '获取设置失败' });
  }
});

app.put('/settings', (req, res) => {
  try {
    const settings = db.updateSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// Focus 路由：返回前4个和其他任务
app.get('/focus', (req, res) => {
  try {
    const tasks = db.getAllTasks();
    
    // 计算排序分数并排序
    const tasksWithScore = tasks.map(task => ({
      ...task,
      score: computeSortingScore(task)
    }));

    tasksWithScore.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    const focus = tasksWithScore.slice(0, 4);
    const others = tasksWithScore.slice(4);

    res.json({ focus, others });
  } catch (error) {
    console.error('获取 Focus 数据失败:', error);
    res.status(500).json({ error: '获取 Focus 数据失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 FocusList 后端服务器运行在 http://localhost:${PORT}`);
  console.log('📋 可用的 API 端点:');
  console.log('  GET    /health                    - 健康检查');
  console.log('  GET    /tasks                     - 获取所有任务');
  console.log('  GET    /tasks/:id                 - 获取单个任务');
  console.log('  POST   /tasks                     - 创建新任务');
  console.log('  PATCH  /tasks/:id                 - 更新任务');
  console.log('  PATCH  /tasks/:id/toggle-complete - 切换任务完成状态');
  console.log('  PATCH  /tasks/:id/toggle-pin      - 切换任务置顶状态');
  console.log('  PATCH  /tasks/:id/toggle-archive  - 切换任务归档状态');
  console.log('  DELETE /tasks/:id                 - 删除任务');
  console.log('  POST   /ai/rewrite                - AI 重写任务');
  console.log('  GET    /ai/test                   - 测试 AI 连接');
  console.log('  GET    /settings                  - 获取设置');
  console.log('  PUT    /settings                  - 更新设置');
  console.log('  GET    /focus                     - 获取 Focus 数据');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  db.close();
  process.exit(0);
});