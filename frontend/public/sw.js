const CACHE_NAME = 'girlfriend-diary-v2';

// 需要預先快取的核心資源（App Shell）
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/heart.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png'
];

// 安裝 Service Worker：預快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// 啟動：清理舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => (name !== CACHE_NAME ? caches.delete(name) : null))
      )
    )
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只處理同源（避免把 supabase / google fonts 等跨域請求丟進快取造成問題）
  if (url.origin !== self.location.origin) {
    return;
  }

  // 導航頁面：Network-first（有網路拿最新，沒網路回快取首頁）
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // 把最新的首頁更新進快取（可選：只更新 '/' 也行）
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/') )
    );
    return;
  }

  // 靜態資源：Cache-first（先快取，沒有再抓網路，成功就寫入快取）
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        // Vite build 後的資源多半是 type: "basic"（同源），這裡保守檢查 ok
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
