const CACHE_NAME = 'girlfriend-diary-v1';

// 需要快取的資源
const urlsToCache = [
  '/',
  '/index.html',
  '/heart.svg',
  '/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('快取已開啟');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 啟動 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果快取中有，直接返回
        if (response) {
          return response;
        }

        // 否則發送網路請求
        return fetch(event.request)
          .then((response) => {
            // 檢查是否有效回應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 複製回應（因為回應只能使用一次）
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 離線時，如果是頁面請求，返回首頁
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});