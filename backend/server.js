const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = 3001;

// 確保 uploads 資料夾存在
const uploadsDir = path.join(__dirname, 'data', 'photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 設定檔案上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 中介軟體
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/photos', express.static(uploadsDir));

// ==================== 健康檢查 ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== 日記 API ====================

// 取得所有日記
app.get('/api/diaries', (req, res) => {
  try {
    const diaries = db.prepare('SELECT * FROM diaries ORDER BY date DESC').all();
    // 解析 tags JSON
    const result = diaries.map(d => ({
      ...d,
      tags: d.tags ? JSON.parse(d.tags) : []
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得單篇日記
app.get('/api/diaries/:date', (req, res) => {
  try {
    const diary = db.prepare('SELECT * FROM diaries WHERE date = ?').get(req.params.date);
    if (diary) {
      diary.tags = diary.tags ? JSON.parse(diary.tags) : [];
    }
    res.json(diary || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增或更新日記
app.post('/api/diaries', (req, res) => {
  try {
    const { date, content, mood, tags, createdAt, updatedAt } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO diaries (date, content, mood, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        content = excluded.content,
        mood = excluded.mood,
        tags = excluded.tags,
        updated_at = excluded.updated_at
    `);
    
    stmt.run(date, content, mood, JSON.stringify(tags || []), createdAt, updatedAt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批次同步日記
app.post('/api/diaries/sync', (req, res) => {
  try {
    const { diaries } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO diaries (date, content, mood, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        content = excluded.content,
        mood = excluded.mood,
        tags = excluded.tags,
        updated_at = excluded.updated_at
    `);
    
    const insertMany = db.transaction((items) => {
      for (const d of items) {
        stmt.run(d.date, d.content, d.mood, JSON.stringify(d.tags || []), d.createdAt, d.updatedAt);
      }
    });
    
    insertMany(diaries);
    res.json({ success: true, count: diaries.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 照片 API ====================

// 取得所有照片
app.get('/api/photos', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得某天的照片
app.get('/api/photos/:date', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM photos WHERE diary_date = ?').all(req.params.date);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 上傳照片（Base64）
app.post('/api/photos', (req, res) => {
  try {
    const { diaryDate, filename, data, caption, createdAt } = req.body;
    
    // 從 Base64 解碼並儲存檔案
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = data.substring('data:image/'.length, data.indexOf(';base64'));
    const newFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filepath = path.join(uploadsDir, newFilename);
    
    fs.writeFileSync(filepath, buffer);
    
    // 存入資料庫
    const stmt = db.prepare(`
      INSERT INTO photos (diary_date, filename, original_name, caption, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(diaryDate, newFilename, filename, caption, createdAt);
    
    res.json({ success: true, id: result.lastInsertRowid, filename: newFilename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批次同步照片
app.post('/api/photos/sync', (req, res) => {
  try {
    const { photos } = req.body;
    const results = [];
    
    for (const photo of photos) {
      const { diaryDate, filename, data, caption, createdAt } = photo;
      
      // 從 Base64 解碼並儲存檔案
      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = data.substring('data:image/'.length, data.indexOf(';base64'));
      const newFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const filepath = path.join(uploadsDir, newFilename);
      
      fs.writeFileSync(filepath, buffer);
      
      const stmt = db.prepare(`
        INSERT INTO photos (diary_date, filename, original_name, caption, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(diaryDate, newFilename, filename, caption, createdAt);
      results.push({ id: result.lastInsertRowid, filename: newFilename });
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除照片
app.delete('/api/photos/:id', (req, res) => {
  try {
    const photo = db.prepare('SELECT filename FROM photos WHERE id = ?').get(req.params.id);
    if (photo) {
      // 刪除檔案
      const filepath = path.join(uploadsDir, photo.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      // 刪除資料庫記錄
      db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 紀念日 API ====================

// 取得所有紀念日
app.get('/api/anniversaries', (req, res) => {
  try {
    const anniversaries = db.prepare('SELECT * FROM anniversaries ORDER BY date').all();
    res.json(anniversaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增紀念日
app.post('/api/anniversaries', (req, res) => {
  try {
    const { title, date, type, remind, createdAt } = req.body;
    const stmt = db.prepare(`
      INSERT INTO anniversaries (title, date, type, remind, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, date, type, remind ? 1 : 0, createdAt);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批次同步紀念日
app.post('/api/anniversaries/sync', (req, res) => {
  try {
    const { anniversaries } = req.body;
    
    // 先清空再匯入（簡單的同步策略）
    db.prepare('DELETE FROM anniversaries').run();
    
    const stmt = db.prepare(`
      INSERT INTO anniversaries (title, date, type, remind, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const a of anniversaries) {
      stmt.run(a.title, a.date, a.type, a.remind ? 1 : 0, a.createdAt);
    }
    
    res.json({ success: true, count: anniversaries.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除紀念日
app.delete('/api/anniversaries/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM anniversaries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 設定 API ====================

app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = JSON.parse(row.value);
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { settings } = req.body;
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, JSON.stringify(value));
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 啟動伺服器
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('💕 女朋友日記後端啟動成功！');
  console.log(`📍 本地: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/health`);
  console.log('');
});