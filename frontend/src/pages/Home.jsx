import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Heart, ChevronRight, Plus, Edit3 } from 'lucide-react';
import { db, getSettings } from '../services/db';
import { getDaysTogether, formatDate, getTodayKey, moodEmojis } from '../utils/helpers';

function Home() {
  const [settings, setSettings] = useState(null);
  const todayKey = getTodayKey();

  // 取得今天的日記
  const todayDiary = useLiveQuery(() => db.diaries.get(todayKey), [todayKey]);

  // 取得最近的日記
  const recentDiaries = useLiveQuery(
    () => db.diaries.orderBy('date').reverse().limit(5).toArray(),
    []
  );

  // 載入設定
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Heart className="animate-pulse text-pink-400" size={48} />
      </div>
    );
  }

  const daysTogether = getDaysTogether(settings.togetherDate);

  return (
    <div className="space-y-6">
      {/* 標題區 */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-800">
          我們的日記 💕
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      {/* 在一起天數卡片 */}
      <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl p-6 text-white shadow-lg">
        <div className="text-center">
          <p className="text-pink-100 text-sm">我們在一起已經</p>
          <div className="flex items-center justify-center gap-2 my-3">
            <Heart className="animate-pulse" fill="white" size={28} />
            <span className="text-5xl font-bold">{daysTogether}</span>
            <Heart className="animate-pulse" fill="white" size={28} />
          </div>
          <p className="text-pink-100 text-sm">天</p>
          <p className="text-pink-200 text-xs mt-2">
            從 {formatDate(settings.togetherDate)} 開始
          </p>
        </div>
      </div>

      {/* 今天的日記 */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Edit3 size={18} className="text-pink-400" />
            今天的日記
          </h2>
          <Link
            to={`/diary/${todayKey}`}
            className="text-pink-500 text-sm flex items-center gap-1 hover:text-pink-600"
          >
            {todayDiary ? '編輯' : '寫日記'}
            <ChevronRight size={16} />
          </Link>
        </div>

        {todayDiary ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {todayDiary.mood && (
                <span className="text-2xl">{moodEmojis[todayDiary.mood]}</span>
              )}
              {todayDiary.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-gray-600 line-clamp-3">{todayDiary.content}</p>
          </div>
        ) : (
          <Link
            to={`/diary/${todayKey}`}
            className="flex flex-col items-center justify-center py-8 text-gray-400 hover:text-pink-400 transition-colors"
          >
            <Plus size={40} strokeWidth={1.5} />
            <p className="mt-2 text-sm">今天還沒寫日記唷～</p>
          </Link>
        )}
      </div>

      {/* 最近的日記 */}
      {recentDiaries && recentDiaries.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart size={18} className="text-pink-400" />
            最近的回憶
          </h2>
          <div className="space-y-3">
            {recentDiaries.map((diary) => (
              <Link
                key={diary.date}
                to={`/diary/${diary.date}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors"
              >
                <span className="text-2xl">
                  {diary.mood ? moodEmojis[diary.mood] : '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">
                    {formatDate(diary.date, 'MM/DD (dd)')}
                  </p>
                  <p className="text-gray-700 truncate">{diary.content}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;