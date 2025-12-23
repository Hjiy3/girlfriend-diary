import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Heart, X, Calendar, Trash2 } from 'lucide-react';
import { db } from '../services/db';
import { formatDate } from '../utils/helpers';
import dayjs from 'dayjs';

const anniversaryTypes = [
  { value: 'together', label: '在一起', icon: '💑' },
  { value: 'first', label: '第一次', icon: '✨' },
  { value: 'birthday', label: '生日', icon: '🎂' },
  { value: 'travel', label: '旅行', icon: '✈️' },
  { value: 'special', label: '特別日子', icon: '💕' },
  { value: 'other', label: '其他', icon: '📅' },
];

function AnniversariesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnniversary, setNewAnniversary] = useState({
    title: '',
    date: '',
    type: 'special',
    remind: true
  });

  // 取得所有紀念日
  const anniversaries = useLiveQuery(
    () => db.anniversaries.orderBy('date').toArray(),
    []
  );

  // 計算倒數天數
  const getDaysUntil = (date) => {
    const target = dayjs(date);
    const now = dayjs();
    
    // 今年的紀念日
    let thisYear = target.year(now.year());
    
    // 如果今年已經過了，算明年的
    if (thisYear.isBefore(now, 'day')) {
      thisYear = thisYear.add(1, 'year');
    }
    
    return thisYear.diff(now, 'day');
  };

  // 新增紀念日
  const handleAdd = async () => {
    if (!newAnniversary.title || !newAnniversary.date) return;

    await db.anniversaries.add({
      ...newAnniversary,
      createdAt: new Date().toISOString()
    });

    setNewAnniversary({ title: '', date: '', type: 'special', remind: true });
    setShowAddModal(false);
  };

  // 刪除紀念日
  const handleDelete = async (id) => {
    if (confirm('確定要刪除這個紀念日嗎？')) {
      await db.anniversaries.delete(id);
    }
  };

  // 依據倒數天數排序
  const sortedAnniversaries = anniversaries?.slice().sort((a, b) => {
    return getDaysUntil(a.date) - getDaysUntil(b.date);
  });

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">紀念日 💕</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 transition-colors"
        >
          <Plus size={18} />
          新增
        </button>
      </div>

      {/* 紀念日列表 */}
      {sortedAnniversaries && sortedAnniversaries.length > 0 ? (
        <div className="space-y-3">
          {sortedAnniversaries.map((anniversary) => {
            const daysUntil = getDaysUntil(anniversary.date);
            const typeInfo = anniversaryTypes.find(t => t.value === anniversary.type);

            return (
              <div
                key={anniversary.id}
                className="bg-white rounded-2xl p-4 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{typeInfo?.icon || '📅'}</span>
                    <div>
                      <h3 className="font-bold text-gray-800">{anniversary.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(anniversary.date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(anniversary.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* 倒數顯示 */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {daysUntil === 0 ? (
                    <div className="text-center">
                      <span className="text-2xl">🎉</span>
                      <span className="text-pink-500 font-bold ml-2">就是今天！</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-gray-600">還有</span>
                      <span className="text-2xl font-bold text-pink-500">{daysUntil}</span>
                      <span className="text-gray-600">天</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">💝</div>
          <p>還沒有紀念日</p>
          <p className="text-sm mt-2">新增你們的特別日子吧！</p>
        </div>
      )}

      {/* 新增紀念日 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">新增紀念日</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 標題 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">名稱</label>
                <input
                  type="text"
                  value={newAnniversary.title}
                  onChange={(e) => setNewAnniversary({ ...newAnniversary, title: e.target.value })}
                  placeholder="例如：第一次約會"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              {/* 日期 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">日期</label>
                <input
                  type="date"
                  value={newAnniversary.date}
                  onChange={(e) => setNewAnniversary({ ...newAnniversary, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              {/* 類型 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">類型</label>
                <div className="grid grid-cols-3 gap-2">
                  {anniversaryTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewAnniversary({ ...newAnniversary, type: type.value })}
                      className={`p-2 rounded-lg text-center transition-all ${
                        newAnniversary.type === type.value
                          ? 'bg-pink-100 border-2 border-pink-400'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-xl">{type.icon}</div>
                      <div className="text-xs text-gray-600">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 按鈕 */}
              <button
                onClick={handleAdd}
                disabled={!newAnniversary.title || !newAnniversary.date}
                className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                新增紀念日
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnniversariesPage;