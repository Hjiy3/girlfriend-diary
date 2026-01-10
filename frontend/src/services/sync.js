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
  // 強制先檢查一次線上狀態，避免 isOnline 尚未更新導致誤判
  await checkOnlineStatus();

  if (!isOnline) {
    throw new Error('雲端未連線');
  }

  try {
    console.log('📥 從雲端拉取資料...');

    // 一次把雲端資料抓下來（避免拉到一半失敗造成半套資料）
    const [diaries, photos, anniversaries] = await Promise.all([
      api.fetchDiaries(),
      api.fetchPhotos(),
      api.fetchAnniversaries()
    ]);

    // wishlist（若後端已提供）
    let wishlist = null;
    if (typeof api.fetchWishlist === 'function') {
      wishlist = await api.fetchWishlist();
    }

    // 用 transaction 確保寫入一致性
    await db.transaction('rw', db.diaries, db.photos, db.anniversaries, db.settings, ...(db.wishlist ? [db.wishlist] : []), async () => {
      // 還原策略：清空後覆蓋（新裝置/新網址最乾淨）
      await db.diaries.clear();
      await db.photos.clear();
      await db.anniversaries.clear();
      if (db.wishlist && wishlist) {
        await db.wishlist.clear();
      }

      // 寫入日記
      if (diaries?.length) {
        const formattedDiaries = diaries.map(diary => ({
          date: diary.date,
          content: diary.content,
          mood: diary.mood,
          tags: diary.tags || [],
          createdAt: diary.created_at,
          updatedAt: diary.updated_at,
          synced: true
        }));
        await db.diaries.bulkPut(formattedDiaries);
      }

      // 寫入照片（關鍵：把 data/base64 寫回 Dexie）
      if (photos?.length) {
        const formattedPhotos = photos.map(p => ({
          // Dexie 的 id 是 ++id（自增），不要用 supabase 的 id 來塞，避免衝突
          diaryDate: p.diary_date,
          filename: p.filename,
          data: p.data,           // Base64（你 GalleryPage 直接用 photo.data 顯示）
          caption: p.caption || '',
          createdAt: p.created_at,
          synced: true
        }));
        await db.photos.bulkAdd(formattedPhotos);
      }

      // 寫入紀念日
      if (anniversaries?.length) {
        const formattedAnniversaries = anniversaries.map(a => ({
          title: a.title,
          date: a.date,
          type: a.type,
          remind: a.remind,
          createdAt: a.created_at
        }));
        // anniversaries 是 ++id，自增即可
        await db.anniversaries.bulkAdd(formattedAnniversaries);
      }

      // 寫入收藏清單（若有）
      if (db.wishlist && wishlist?.length) {
        const formattedWishlist = wishlist.map(w => ({
          type: w.type,
          name: w.name,
          location: w.location,
          note: w.note || '',
          done: !!w.done,
          createdAt: w.created_at || w.createdAt || new Date().toISOString(),
          synced: true
        }));
        await db.wishlist.bulkAdd(formattedWishlist);
      }
    });

    console.log('✅ 拉取完成！');
    return {
      diaries: diaries?.length || 0,
      photos: photos?.length || 0,
      anniversaries: anniversaries?.length || 0,
      wishlist: wishlist?.length || 0
    };

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
