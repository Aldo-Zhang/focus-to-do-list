const axios = require('axios');
const DatabaseManager = require('../../db');

// 移除 TypeScript 接口，使用 JSDoc 注释

class AIService {
  constructor() {
    this.db = new DatabaseManager();
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:latest';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT_MS || '8000');
  }

  async loadSettings() {
    try {
      const settings = this.db.getSettings();
      if (settings.ollamaBaseUrl) {
        this.baseUrl = settings.ollamaBaseUrl;
      }
      if (settings.ollamaModel) {
        this.model = settings.ollamaModel;
      }
    } catch (error) {
      console.warn('Failed to load AI settings from database:', error);
    }
  }

  async rewriteTask(rawText, userRules) {
    try {
      // 每次调用时都加载最新的设置
      await this.loadSettings();
      const prompt = this.buildPrompt(rawText, userRules);
      const response = await this.callOllama(prompt);
      return this.parseResponse(response, rawText);
    } catch (error) {
      console.warn('Ollama rewrite failed, using fallback:', error);
      return this.fallbackRewrite(rawText);
    }
  }

  buildPrompt(rawText, userRules) {
    const basePrompt = `Rewrite this task into a clear, actionable goal. Return ONLY a JSON object with this exact structure:
{
  "title": "Clear, specific task title",
  "tags": ["tag1", "tag2"],
  "urgency": 0-3,
  "due": "YYYY-MM-DD" (optional, only if date is mentioned)
}

Task: "${rawText}"`;

    if (userRules) {
      return `${basePrompt}\n\nUser rules: ${userRules}`;
    }

    return basePrompt;
  }

  async callOllama(prompt) {
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      },
      {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.response;
  }

  parseResponse(response, originalText) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Check if due date is valid (not template string)
        let due = parsed.due;
        if (due && (due === 'YYYY-MM-DD' || !this.isValidDate(due))) {
          // If AI returned template or invalid date, use fallback for date parsing
          const fallback = this.fallbackRewrite(originalText);
          due = fallback.due;
        }
        
        return {
          title: parsed.title || 'Untitled Task',
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          urgency: Math.max(0, Math.min(3, parsed.urgency || 1)),
          due: due,
        };
      }
    } catch (error) {
      console.warn('Failed to parse Ollama JSON response:', error);
    }

    // Fallback parsing
    return this.fallbackRewrite(originalText);
  }

  isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    
    // Check if it's a template string
    if (dateString === 'YYYY-MM-DD' || dateString.includes('YYYY') || dateString.includes('MM') || dateString.includes('DD')) {
      return false;
    }
    
    // Check if it's a valid date format
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return false;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if the year is reasonable (not too far in the past or future)
    const currentYear = new Date().getFullYear();
    const year = parseInt(dateString.split('-')[0]);
    
    // Allow dates from current year to 2030 (reasonable range for task due dates)
    if (year < currentYear || year > 2030) {
      return false;
    }
    
    // Additional check: if it's the current year, make sure it's not in the past
    if (year === currentYear) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      if (date < today) {
        return false;
      }
    }
    
    return true;
  }

  fallbackRewrite(rawText) {
    const text = rawText.toLowerCase();
    let urgency = 1;
    const tags = [];

    // Work-related keywords
    if (/\b(job|offer|recruiter|resume|oa|interview|career|work|project|report|deadline|meeting|email)\b/.test(text)) {
      urgency = Math.min(urgency + 1, 3);
      tags.push('work');
    }

    // Health-related keywords
    if (/\b(doctor|rx|insurance|medical|health|appointment|dentist|hospital|exercise|workout|gym)\b/.test(text)) {
      urgency = Math.min(urgency + 1, 3);
      tags.push('health');
    }

    // Social related keywords
    if (/\b(dinner|party|hangout|social|friends|meeting|date)\b/.test(text)) {
      urgency = Math.max(urgency - 1, 0);
      tags.push('social');
    }

    // Learning related keywords
    if (/\b(study|learn|research|paper|course|education|training|read|book)\b/.test(text)) {
      tags.push('learning');
    }

    // Time-related keywords
    if (/\b(urgent|asap|immediately|today|tomorrow|friday|monday|deadline)\b/.test(text)) {
      urgency = Math.min(urgency + 1, 3);
    }

    // Extract due date
    let due;
    const dateMatch = rawText.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|tomorrow|today|friday|monday|next week)/i);
    if (dateMatch) {
      const dateStr = dateMatch[0].toLowerCase();
      if (dateStr === 'today') {
        due = new Date().toISOString().split('T')[0];
      } else if (dateStr === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        due = tomorrow.toISOString().split('T')[0];
      } else if (dateStr === 'friday') {
        const friday = new Date();
        const daysUntilFriday = (5 - friday.getDay() + 7) % 7;
        friday.setDate(friday.getDate() + daysUntilFriday);
        due = friday.toISOString().split('T')[0];
      } else if (dateStr === 'monday') {
        const monday = new Date();
        const daysUntilMonday = (1 - monday.getDay() + 7) % 7;
        monday.setDate(monday.getDate() + daysUntilMonday);
        due = monday.toISOString().split('T')[0];
      } else if (dateStr === 'next week') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        due = nextWeek.toISOString().split('T')[0];
      } else {
        // Try to parse the date
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          due = parsedDate.toISOString().split('T')[0];
        }
      }
    }

    return {
      title: rawText,
      tags,
      urgency: Math.max(0, Math.min(3, urgency)),
      due,
    };
  }

  async testConnection() {
    try {
      await this.rewriteTask('test connection');
      return true;
    } catch (error) {
      return false;
    }
  }
}

const aiService = new AIService();

module.exports = { aiService };
