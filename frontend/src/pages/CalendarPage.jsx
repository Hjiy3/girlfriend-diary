import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../services/db';
import { moodEmojis } from '../utils/helpers';
import dayjs from 'dayjs';

function CalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // 取得當月所有日記
  const monthStart = currentMonth.startOf('month').format('YYYY-MM-DD');
  const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');

  const diaries = useLiveQuery(
    () => db.diaries
      .where('date')
      .between(monthStart, monthEnd, true, true)
      .toArray(),
    [monthStart, monthEnd]
  );

  // 建立日記 map 方便查詢
  const diaryMap = {};
  diaries?.forEach(d => {
    diaryMap[d.date] = d;
  });

  // 產生日曆格子
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day(); // 這個月第一天是星期幾
    const daysInMonth = endOfMonth.date();

    const days = [];

    // 補上月的空白
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 這個月的每一天
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentMonth.date(day).format('YYYY-MM-DD');
      days.push({
        day,
        date,
        diary: diaryMap[date],
        isToday: date === dayjs().format('YYYY-MM-DD')
      });
    }

    return days;
  };

  const days = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-4">
      {/* 月份切換 */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md">
        <button
          onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>

        <h1 className="text-xl font-bold text-gray-800">
          {currentMonth.format('YYYY年 MM月')}
        </h1>

        <button
          onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors"
        >
          <ChevronRight size={24} className="text-gray-600" />
        </button>
      </div>

      {/* 日曆 */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        {/* 星期標題 */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayInfo, index) => (
            <div key={index} className="aspect-square">
              {dayInfo && (
                <button
                  onClick={() => navigate(`/diary/${dayInfo.date}`)}
                  className={`w-full h-full rounded-lg flex flex-col items-center justify-center transition-all ${
                    dayInfo.isToday
                      ? 'bg-pink-500 text-white'
                      : dayInfo.diary
                      ? 'bg-pink-100 hover:bg-pink-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-sm ${dayInfo.isToday ? 'font-bold' : ''}`}>
                    {dayInfo.day}
                  </span>
                  {dayInfo.diary?.mood && (
                    <span className="text-xs">
                      {moodEmojis[dayInfo.diary.mood]}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 圖例 */}
      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-pink-500"></div>
          <span>今天</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-pink-100"></div>
          <span>有日記</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;