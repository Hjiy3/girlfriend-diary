import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, MapPin, UtensilsCrossed, Trash2, CheckCircle2 } from 'lucide-react';
import { db } from '../services/db';

function WishlistPage() {
  const [type, setType] = useState('place'); // place | food
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  const items = useLiveQuery(
    () => db.wishlist.orderBy('createdAt').reverse().toArray(),
    []
  );

  const groups = useMemo(() => {
    const res = { food: [], place: [] };
    (items || []).forEach(i => {
      if (i.type === 'food') res.food.push(i);
      else res.place.push(i);
    });
    return res;
  }, [items]);

  async function addItem() {
    const trimmedName = name.trim();
    const trimmedLoc = location.trim();
    const trimmedNote = note.trim();

    if (!trimmedName) return;

    await db.wishlist.add({
      type,
      name: trimmedName,
      location: trimmedLoc,
      note: trimmedNote,
      done: false,
      createdAt: new Date().toISOString(),
      synced: false
    });

    setName('');
    setLocation('');
    setNote('');
  }

  async function toggleDone(id, done) {
    await db.wishlist.update(id, { done: !done, synced: false });
  }

  async function removeItem(id) {
    await db.wishlist.delete(id);
  }

  const renderItem = (item) => (
    <div
      key={item.id}
      className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-3 ${
        item.done ? 'border-green-200 opacity-80' : 'border-pink-100'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {item.type === 'food' ? (
            <UtensilsCrossed size={16} className="text-pink-500" />
          ) : (
            <MapPin size={16} className="text-pink-500" />
          )}
          <h3 className={`font-semibold text-gray-800 truncate ${item.done ? 'line-through' : ''}`}>
            {item.name}
          </h3>
        </div>

        {item.location && (
          <p className="text-sm text-gray-500 mt-1 truncate">
            📍 {item.location}
          </p>
        )}
        {item.note && (
          <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
            {item.note}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => toggleDone(item.id, item.done)}
          className={`p-2 rounded-lg ${
            item.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          } hover:opacity-90`}
          title={item.done ? '標記為未完成' : '標記為已完成'}
        >
          <CheckCircle2 size={18} />
        </button>

        <button
          onClick={() => removeItem(item.id)}
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:opacity-90"
          title="刪除"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">收藏清單 ✨</h1>
        <p className="text-gray-500 text-sm mt-1">把想去的地方、想吃的店先記下來</p>
      </div>

      {/* 新增區 */}
      <div className="bg-white rounded-2xl border border-pink-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setType('place')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              type === 'place' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            想去的地方
          </button>
          <button
            onClick={() => setType('food')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              type === 'food' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            想吃的東西
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'food' ? '店名 / 品項（必填）' : '景點 / 店名（必填）'}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
        />

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="在哪裡（例如：台北信義 / 台中西屯 / 日本東京）"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="備註（可貼 IG 連結 / 想吃什麼 / 想做什麼）"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
        />

        <button
          onClick={addItem}
          className="w-full inline-flex items-center justify-center gap-2 bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition-colors"
        >
          <Plus size={18} />
          新增
        </button>
      </div>

      {/* 清單 */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-bold text-gray-700">想去的地方</h2>
          {groups.place.length ? (
            <div className="space-y-3">{groups.place.map(renderItem)}</div>
          ) : (
            <div className="text-sm text-gray-400">目前沒有清單</div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-gray-700">想吃的東西</h2>
          {groups.food.length ? (
            <div className="space-y-3">{groups.food.map(renderItem)}</div>
          ) : (
            <div className="text-sm text-gray-400">目前沒有清單</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WishlistPage;
