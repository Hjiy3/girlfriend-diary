import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-tw';

dayjs.extend(relativeTime);
dayjs.locale('zh-tw');

// 計算在一起的天數
export function getDaysTogether(startDate) {
  const start = dayjs(startDate);
  const now = dayjs();
  return now.diff(start, 'day');
}

// 格式化日期顯示
export function formatDate(date, format = 'YYYY年MM月DD日') {
  return dayjs(date).format(format);
}

// 格式化為 ISO 日期 (用於資料庫 key)
export function toDateKey(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

// 取得今天的日期 key
export function getTodayKey() {
  return toDateKey(new Date());
}

// 心情 emoji 對應
export const moodEmojis = {
  'love': '🥰',
  'happy': '😊',
  'excited': '🤩',
  'normal': '😌',
  'tired': '😴',
  'sad': '😢',
  'angry': '😤',
  'miss': '🥺'
};

// 標籤顏色對應
export const tagColors = {
  '約會': 'bg-pink-200 text-pink-800',
  '日常': 'bg-blue-200 text-blue-800',
  '旅行': 'bg-green-200 text-green-800',
  '紀念日': 'bg-purple-200 text-purple-800',
  '吵架': 'bg-red-200 text-red-800',
  '驚喜': 'bg-yellow-200 text-yellow-800',
  '第一次': 'bg-orange-200 text-orange-800'
};