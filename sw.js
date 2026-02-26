// 缓存名称与版本
const CACHE_NAME = 'localmemo_v1.0';
// 需要缓存的核心文件
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 安装Service Worker：缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：离线优先，缓存优先
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存中有，直接返回缓存内容
        if (response) {
          return response;
        }
        // 缓存中没有，发起网络请求
        return fetch(event.request).then((res) => {
          // 不缓存非GET请求、云同步API请求
          if (event.request.method !== 'GET' || event.request.url.includes('api.github.com')) {
            return res;
          }
          // 缓存新的请求结果
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, res.clone());
            return res;
          });
        });
      })
  );
});
