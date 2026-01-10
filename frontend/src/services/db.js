import Dexie from 'dexie';

// 建立資料庫
export const db = new Dexie('GirlfriendDiaryDB');

// v1：原本的結構
db.version(1).stores({
  diaries: '&date, mood, createdAt, updatedAt, synced',
  photos: '++id, diaryDate, filename, caption, createdAt, synced',
  anniversaries: '++id, title, date, type, remind, createdAt',
  settings: 'key',
  lineChats: '++id, date, time, sender, message, importedAt'
});

// v2：新增 wishlist
db.version(2).stores({
  diaries: '&date, mood, createdAt, updatedAt, synced',
  photos: '++id, diaryDate, filename, caption, createdAt, synced',
  anniversaries: '++id, title, date, type, remind, createdAt',
  settings: 'key',
  lineChats: '++id, date, time, sender, message, importedAt',

  // 收藏清單：想去/想吃
  // type: 'place' | 'food'
  // done: boolean
  wishlist: '++id, type, name, location, done, createdAt, synced'
});

// 預設設定
export const defaultSettings = {
  coupleName: ['我', '寶貝'],
  togetherDate: '2024-08-13',
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
