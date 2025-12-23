import Dexie from 'dexie';

// 建立資料庫
export const db = new Dexie('GirlfriendDiaryDB');

// 定義資料表結構
db.version(1).stores({
  // 日記表
  diaries: '&date, mood, createdAt, updatedAt, synced',
  // 照片表
  photos: '++id, diaryDate, filename, caption, createdAt, synced',
  // 紀念日表
  anniversaries: '++id, title, date, type, remind, createdAt',
  // 設定表
  settings: 'key',
  // LINE 對話記錄
  lineChats: '++id, date, time, sender, message, importedAt'
});

// 預設設定
export const defaultSettings = {
  coupleName: ['我', '寶貝'],
  togetherDate: '2024-08-13', // 在一起的日期，之後可以改
  theme: 'pink'
};

// 初始化設定
export async function initSettings() {
  const existing = await db.settings.get('main');
  if (!existing) {
    await db.settings.put({ key: 'main', ...defaultSettings });
  }
}

// 取得設定
export async function getSettings() {
  const settings = await db.settings.get('main');
  return settings || defaultSettings;
}

// 更新設定
export async function updateSettings(newSettings) {
  await db.settings.update('main', newSettings);
}