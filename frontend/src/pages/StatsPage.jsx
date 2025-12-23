import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '../services/db';
import { moodEmojis } from '../utils/helpers';

function StatsPage() {
  // 取得所有日記
  const diaries = useLiveQuery(() => db.diaries.toArray(), []);
  const photos = useLiveQuery(() => db.photos.toArray(), []);

  if (!diaries) {
    return <div className="text-center py-16 text-gray-400">載入中...</div>;
  }

  // 計算心情統計
  const moodStats = {};
  diaries.forEach(diary => {
    if (diary.mood) {
      moodStats[diary.mood] = (moodStats[diary.mood] || 0) + 1;
    }
  });

  const moodChartData = Object.entries(moodStats).map(([mood, count]) => ({
    name: moodEmojis[mood],
    value: count,
    mood
  }));

  // 計算標籤統計
  const tagStats = {};
  diaries.forEach(diary => {
    diary.tags?.forEach(tag => {
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    });
  });

  const tagChartData = Object.entries(tagStats)
    .map(([tag, count]) => ({ name: tag, count }))
    .sort((a, b) => b.count - a.count);

  // 顏色
  const COLORS = ['#ff6b9d', '#ff8fab', '#ffc2d1', '#ffb3c6', '#ff85a1', '#f9bec7', '#f7a1b5', '#e890a0'];

  // 計算連續寫日記天數
  const calculateStreak = () => {
    if (diaries.length === 0) return 0;
    
    const sortedDates = diaries
      .map(d => d.date)
      .sort()
      .reverse();
    
    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i]);
      const next = new Date(sortedDates[i + 1]);
      const diffDays = (current - next) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">回憶統計 📊</h1>
      </div>

      {/* 數字統計卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-md text-center">
          <div className="text-3xl font-bold text-pink-500">{diaries.length}</div>
          <div className="text-gray-500 text-sm">篇日記</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md text-center">
          <div className="text-3xl font-bold text-pink-500">{photos?.length || 0}</div>
          <div className="text-gray-500 text-sm">張照片</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md text-center">
          <div className="text-3xl font-bold text-pink-500">{calculateStreak()}</div>
          <div className="text-gray-500 text-sm">連續天數</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md text-center">
          <div className="text-3xl font-bold text-pink-500">{Object.keys(tagStats).length}</div>
          <div className="text-gray-500 text-sm">種標籤</div>
        </div>
      </div>

      {/* 心情分佈 */}
      {moodChartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h2 className="font-bold text-gray-800 mb-4">心情分佈 💭</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moodChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {moodChartData.map((entry, index) => (
                    <Cell key={entry.mood} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 標籤統計 */}
      {tagChartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h2 className="font-bold text-gray-800 mb-4">標籤統計 🏷️</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#ff6b9d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 如果沒有資料 */}
      {diaries.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <p>還沒有日記資料</p>
          <p className="text-sm mt-2">開始寫日記後就能看到統計囉！</p>
        </div>
      )}
    </div>
  );
}

export default StatsPage;