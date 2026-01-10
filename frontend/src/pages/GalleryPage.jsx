import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Calendar, Download } from 'lucide-react';
import { db } from '../services/db';
import { formatDate } from '../utils/helpers';

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || 'photo.jpg';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function GalleryPage() {
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 取得所有照片，按日期排序
  const photos = useLiveQuery(
    () => db.photos.orderBy('diaryDate').reverse().toArray(),
    []
  );

  // 按月份分組
  const groupedPhotos = {};
  photos?.forEach(photo => {
    const month = photo.diaryDate.substring(0, 7); // YYYY-MM
    if (!groupedPhotos[month]) {
      groupedPhotos[month] = [];
    }
    groupedPhotos[month].push(photo);
  });

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">照片牆 📸</h1>
        <p className="text-gray-500 text-sm mt-1">
          共 {photos?.length || 0} 張照片
        </p>
      </div>

      {/* 照片列表 */}
      {Object.keys(groupedPhotos).length > 0 ? (
        Object.entries(groupedPhotos).map(([month, monthPhotos]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700 px-1">
              {formatDate(month + '-01', 'YYYY年 MM月')}
            </h2>
            <div className="grid grid-cols-3 gap-1">
              {monthPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.data}
                    alt={photo.filename}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">📷</div>
          <p>還沒有照片</p>
          <p className="text-sm mt-2">在日記中新增照片吧！</p>
        </div>
      )}

      {/* 照片預覽 Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={28} />
          </button>

          <div className="max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.data}
              alt={selectedPhoto.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  navigate(`/diary/${selectedPhoto.diaryDate}`);
                  setSelectedPhoto(null);
                }}
                className="inline-flex items-center gap-2 text-white bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <Calendar size={18} />
                {formatDate(selectedPhoto.diaryDate)}
              </button>

              <button
                onClick={() => {
                  const safeName =
                    selectedPhoto.originalName ||
                    selectedPhoto.filename ||
                    `photo-${selectedPhoto.diaryDate}.jpg`;
                  downloadDataUrl(selectedPhoto.data, safeName);
                }}
                className="inline-flex items-center gap-2 text-white bg-pink-500/80 px-4 py-2 rounded-full hover:bg-pink-500 transition-colors"
              >
                <Download size={18} />
                下載
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
