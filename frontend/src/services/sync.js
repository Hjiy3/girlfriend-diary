import { db } from './db';
import * as api from './api';

// 同步狀態
let isOnline = false;
let isSyncing = false;
let syncListeners = [];

// 註冊同步狀態監聯器
export function onSyncStatusChange(callback) {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter(cb => cb !== callback);
  };
}

// 通知所有監聽器
function notifyListeners(status) {
  syncListeners.forEach(cb => cb(status));
}

// 檢查雲端狀態
export async function checkOnlineStatus() {
  const wasOnline = isOnline;

  try {
    isOnline = await api.checkBackendHealth();
  } catch {
    isOnline = false;
  }

  // 如果剛上線，自動同步
  if (!wasOnline && isOnline) {
    console.log('🟢 雲端已連線，開始同步...');
    await syncAll();
  }

  return isOnline;
}

// 取得目前狀態
export function getOnlineStatus() {
  return isOnline;
}

// 同步所有資料到雲端
export async function syncAll() {
  if (isSyncing) return;

  isSyncing = true;
  notifyListeners({ syncing: true });

  try {
    // 同步未同步的日記
    const unsyncedDiaries = await db.diaries.filter(d => !d.synced).toArray();
    if (unsyncedDiaries.length > 0) {
      console.log(`📤 同步 ${unsyncedDiaries.length} 篇日記到雲端...`);
      await api.syncDiaries(unsyncedDiaries);

      for (const diary of unsyncedDiaries) {
        await db.diaries.update(diary.date, { synced: true });
      }
    }

    // 同步未同步的照片
    const unsyncedPhotos = await db.photos.filter(p => !p.synced).toArray();
    if (unsyncedPhotos.length > 0) {
      console.log(`📤 同步 ${unsyncedPhotos.length} 張照片到雲端...`);
      await api.syncPhotos(unsyncedPhotos);

      for (const photo of unsyncedPhotos) {
        await db.photos.update(photo.id, { synced: true });
      }
    }

    // 同步紀念日
    const anniversaries = await db.anniversaries.toArray();
    if (anniversaries.length > 0) {
      console.log(`📤 同步 ${anniversaries.length} 個紀念日到雲端...`);
      await api.syncAnniversaries(anniversaries);
    }

    // 同步設定
    const settings = await db.settings.get('main');
    if (settings) {
      await api.saveSettings({ main: settings });
    }

    // 同步收藏清單（若後端還沒做，先略過不影響）
    const unsyncedWishlist = await db.wishlist?.filter(i => !i.synced).toArray();
    if (unsyncedWishlist?.length > 0) {
      if (typeof api.syncWishlist === 'function') {
        console.log(`📤 同步 ${unsyncedWishlist.length} 筆收藏到雲端...`);
        await api.syncWishlist(unsyncedWishlist);

        for (const item of unsyncedWishlist) {
          await db.wishlist.update(item.id, { synced: true });
        }
      } else {
        console.log('ℹ️ 後端尚未提供 wishlist 同步 API，先略過');
      }
    }

    console.log('✅ 同步完成！');
    notifyListeners({ syncing: false, success: true, lastSync: new Date() });

  } catch (error) {
    console.error('❌ 同步失敗:', error);
    notifyListeners({ syncing: false, success: false, error });
  } finally {
    isSyncing = false;
  }
}

// 從雲端拉取資料（用於還原或新裝置）
export async function pullFromCloud() {
  if (!isOnline) {
    throw new Error('雲端未連線');
  }

  try {
    console.log('📥 從雲端拉取資料...');

    // 拉取日記
    const diaries = await api.fetchDiaries();
    for (const diary of diaries) {
      await db.diaries.put({
        date: diary.date,
        content: diary.content,
        mood: diary.mood,
        tags: diary.tags || [],
        createdAt: diary.created_at,
        updatedAt: diary.updated_at,
        synced: true
      });
    }

    // 拉取紀念日
    const anniversaries = await api.fetchAnniversaries();
    await db.anniversaries.clear();
    for (const a of anniversaries) {
      await db.anniversaries.add({
        title: a.title,
        date: a.date,
        type: a.type,
        remind: a.remind,
        createdAt: a.created_at
      });
    }

    // 拉取收藏清單（若後端已提供）
    if (typeof api.fetchWishlist === 'function') {
      const wishlist = await api.fetchWishlist();
      await db.wishlist.clear();
      for (const w of wishlist) {
        await db.wishlist.add({
          type: w.type,
          name: w.name,
          location: w.location,
          note: w.note || '',
          done: !!w.done,
          createdAt: w.created_at || w.createdAt || new Date().toISOString(),
          synced: true
        });
      }
    }

    console.log('✅ 拉取完成！');
    return { diaries: diaries.length, anniversaries: anniversaries.length };

  } catch (error) {
    console.error('❌ 拉取失敗:', error);
    throw error;
  }
}

// 啟動定時檢查
export function startSyncScheduler() {
  setInterval(checkOnlineStatus, 30000);
  checkOnlineStatus();
  console.log('🔄 雲端同步排程已啟動');
}
