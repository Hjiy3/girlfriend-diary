import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ArrowLeft, Save, Image, X, ChevronLeft, ChevronRight,
  Trash2
} from 'lucide-react';
import { db } from '../services/db';
import { formatDate, moodEmojis, tagColors, toDateKey } from '../utils/helpers';
import dayjs from 'dayjs';

const availableTags = ['約會', '日常', '旅行', '紀念日', '吵架', '驚喜', '第一次'];

function DiaryPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // 取得這天的日記
  const diary = useLiveQuery(() => db.diaries.get(date), [date]);

  // 取得這天的照片
  const photos = useLiveQuery(
    () => db.photos.where('diaryDate').equals(date).toArray(),
    [date]
  );

  // 載入現有日記內容
  useEffect(() => {
    if (diary) {
      setContent(diary.content || '');
      setMood(diary.mood || '');
      setTags(diary.tags || []);
    } else {
      setContent('');
      setMood('');
      setTags([]);
    }
  }, [diary]);

  // 儲存日記
  const handleSave = async () => {
    setSaving(true);
    try {
      const diaryData = {
        date,
        content,
        mood,
        tags,
        updatedAt: new Date().toISOString(),
        synced: false
      };

      if (diary) {
        await db.diaries.update(date, diaryData);
      } else {
        await db.diaries.add({
          ...diaryData,
          createdAt: new Date().toISOString()
        });
      }

      // 短暫顯示儲存成功
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      console.error('儲存失敗:', error);
      setSaving(false);
    }
  };

  // 切換標籤
  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  // 上傳照片
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        await db.photos.add({
          diaryDate: date,
          filename: file.name,
          data: event.target.result, // Base64 編碼的圖片
          caption: '',
          createdAt: new Date().toISOString(),
          synced: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 刪除照片
  const handleDeletePhoto = async (photoId) => {
    if (confirm('確定要刪除這張照片嗎？')) {
      await db.photos.delete(photoId);
    }
  };

  // 前一天 / 後一天
  const goToDate = (offset) => {
    const newDate = dayjs(date).add(offset, 'day').format('YYYY-MM-DD');
    navigate(`/diary/${newDate}`);
  };

  return (
    <div className="space-y-4">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>

        {/* 日期切換 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToDate(-1)}
            className="p-1 hover:bg-pink-100 rounded-full"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">
            {formatDate(date, 'MM月DD日 (dd)')}
          </h1>
          <button
            onClick={() => goToDate(1)}
            className="p-1 hover:bg-pink-100 rounded-full"
          >
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`p-2 rounded-full transition-colors ${
            saving 
              ? 'bg-green-100 text-green-500' 
              : 'bg-pink-100 text-pink-500 hover:bg-pink-200'
          }`}
        >
          <Save size={24} />
        </button>
      </div>

      {/* 心情選擇 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">今天的心情</span>
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="text-3xl hover:scale-110 transition-transform"
          >
            {mood ? moodEmojis[mood] : '😶'}
          </button>
        </div>

        {showMoodPicker && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {Object.entries(moodEmojis).map(([key, emoji]) => (
              <button
                key={key}
                onClick={() => {
                  setMood(key);
                  setShowMoodPicker(false);
                }}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  mood === key 
                    ? 'bg-pink-100 scale-110' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 標籤選擇 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 text-sm">標籤</span>
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="text-pink-500 text-sm"
          >
            {showTagPicker ? '完成' : '編輯'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className={`px-3 py-1 rounded-full text-sm ${tagColors[tag] || 'bg-gray-200 text-gray-700'}`}
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">點擊編輯添加標籤</span>
          )}
        </div>

        {showTagPicker && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  tags.includes(tag)
                    ? tagColors[tag]
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 日記內容 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天發生了什麼事呢？&#10;&#10;記錄下和寶貝的點點滴滴..."
          className="w-full h-48 resize-none outline-none text-gray-700 placeholder-gray-300"
        />
      </div>

      {/* 照片區 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 text-sm">今日照片</span>
          <label className="flex items-center gap-1 text-pink-500 text-sm cursor-pointer hover:text-pink-600">
            <Image size={18} />
            新增照片
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square">
                <img
                  src={photo.data}
                  alt={photo.filename}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-300">
            <Image size={40} className="mx-auto mb-2" />
            <p className="text-sm">還沒有照片</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiaryPage;