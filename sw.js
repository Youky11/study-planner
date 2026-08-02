const CACHE_NAME = 'study-planner-v7';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // 不缓存 GitHub API 请求（同步用）和动态文件
  if (url.includes('api.github.com') || url.includes('sync-data.json')) {
    return;
  }
  // 对于其他请求，先网络后缓存（确保拿到最新版本）
  e.respondWith(
    fetch(e.request).then(resp => {
      // 成功的请求才缓存
      if (resp && resp.status === 200) {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, respClone));
      }
      return resp;
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});
