import { useState, useEffect } from 'react';
import { Heart, Download, Upload, Trash2, Database } from 'lucide-react';
import { db, getSettings, updateSettings } from '../services/db';
import { formatDate, getDaysTogether } from '../utils/helpers';

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ diaries: 0, photos: 0, anniversaries: 0 });

  // 載入設定
  useEffect(() => {
    getSettings().then(setSettings);
    
    // 載入統計
    Promise.all([
      db.diaries.count(),
      db.photos.count(),
      db.anniversaries.count()
    ]).then(([diaries, photos, anniversaries]) => {
      setStats({ diaries, photos, anniversaries });
    });
  }, []);

  // 儲存設定
  const handleSave = async () => {
    setSaving(true);
    await updateSettings(settings);
    setTimeout(() => setSaving(false), 500);
  };

  // 匯出資料
  const handleExport = async () => {
    const data = {
      settings: await db.settings.toArray(),
      diaries: await db.diaries.toArray(),
      photos: await db.photos.toArray(),
      anniversaries: await db.anniversaries.toArray(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `girlfriend-diary-backup-${formatDate(new Date(), 'YYYY-MM-DD')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 匯入資料
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmImport = confirm('匯入會覆蓋現有資料，確定要繼續嗎？');
    if (!confirmImport) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // 清空現有資料
        await db.settings.clear();
        await db.diaries.clear();
        await db.photos.clear();
        await db.anniversaries.clear();

        // 匯入新資料
        if (data.settings) await db.settings.bulkAdd(data.settings);
        if (data.diaries) await db.diaries.bulkAdd(data.diaries);
        if (data.photos) await db.photos.bulkAdd(data.photos);
        if (data.anniversaries) await db.anniversaries.bulkAdd(data.anniversaries);

        alert('匯入成功！');
        window.location.reload();
      } catch (error) {
        alert('匯入失敗：檔案格式錯誤');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  // 清除所有資料
  const handleClearAll = async () => {
    const confirmClear = confirm('確定要清除所有資料嗎？此操作無法復原！');
    if (!confirmClear) return;

    const doubleConfirm = confirm('真的確定嗎？所有日記、照片、紀念日都會被刪除！');
    if (!doubleConfirm) return;

    await db.diaries.clear();
    await db.photos.clear();
    await db.anniversaries.clear();

    alert('已清除所有資料');
    window.location.reload();
  };

  if (!settings) {
    return <div className="text-center py-16 text-gray-400">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">設定 ⚙️</h1>
      </div>

      {/* 基本設定 */}
      <div className="bg-white rounded-2xl p-4 shadow-md space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Heart size={18} className="text-pink-400" />
          基本設定
        </h2>

        {/* 暱稱 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">我的暱稱</label>
            <input
              type="text"
              value={settings.coupleName[0]}
              onChange={(e) => setSettings({
                ...settings,
                coupleName: [e.target.value, settings.coupleName[1]]
              })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">寶貝的暱稱</label>
            <input
              type="text"
              value={settings.coupleName[1]}
              onChange={(e) => setSettings({
                ...settings,
                coupleName: [settings.coupleName[0], e.target.value]
              })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>

        {/* 在一起的日期 */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">在一起的日期</label>
          <input
            type="date"
            value={settings.togetherDate}
            onChange={(e) => setSettings({ ...settings, togetherDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            已經在一起 {getDaysTogether(settings.togetherDate)} 天 💕
          </p>
        </div>

        {/* 儲存按鈕 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            saving
              ? 'bg-green-100 text-green-600'
              : 'bg-pink-500 text-white hover:bg-pink-600'
          }`}
        >
          {saving ? '已儲存 ✓' : '儲存設定'}
        </button>
      </div>

      {/* 資料統計 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Database size={18} className="text-pink-400" />
          資料統計
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-pink-50 rounded-lg p-3">
            <div className="text-xl font-bold text-pink-500">{stats.diaries}</div>
            <div className="text-xs text-gray-500">篇日記</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3">
            <div className="text-xl font-bold text-pink-500">{stats.photos}</div>
            <div className="text-xs text-gray-500">張照片</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3">
            <div className="text-xl font-bold text-pink-500">{stats.anniversaries}</div>
            <div className="text-xs text-gray-500">個紀念日</div>
          </div>
        </div>
      </div>

      {/* 備份與還原 */}
      <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Download size={18} className="text-pink-400" />
          備份與還原
        </h2>

        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 py-2 border border-pink-300 text-pink-500 rounded-lg hover:bg-pink-50 transition-colors"
        >
          <Download size={18} />
          匯出備份檔案
        </button>

        <label className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <Upload size={18} />
          匯入備份檔案
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* 危險區域 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h2 className="font-bold text-red-500 flex items-center gap-2 mb-3">
          <Trash2 size={18} />
          危險區域
        </h2>
        <button
          onClick={handleClearAll}
          className="w-full py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          清除所有資料
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          此操作無法復原，請先備份！
        </p>
      </div>
    </div>
  );
}

export default SettingsPage;