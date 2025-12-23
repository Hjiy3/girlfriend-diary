const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 確保 data 資料夾存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 建立資料庫連線
const db = new Database(path.join(dataDir, 'girlfriend-diary.db'));

// 啟用外鍵支援
db.pragma('journal_mode = WAL');

// 建立資料表
db.exec(`
  -- 日記表
  CREATE TABLE IF NOT EXISTS diaries (
    date TEXT PRIMARY KEY,
    content TEXT,
    mood TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 照片表
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diary_date TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT,
    caption TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (diary_date) REFERENCES diaries(date)
  );

  -- 紀念日表
  CREATE TABLE IF NOT EXISTS anniversaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT,
    remind INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  -- 設定表
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- LINE 對話表
  CREATE TABLE IF NOT EXISTS line_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    time TEXT,
    sender TEXT,
    message TEXT,
    imported_at TEXT NOT NULL
  );
`);

console.log('✅ 資料庫初始化完成');

module.exports = db;