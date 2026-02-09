/**
 * Storys Universe - Service Worker
 * =================================
 * 用於離線支援與快取策略
 */

const CACHE_NAME = 'storys-universe-v2';
const STATIC_ASSETS = [
    '/storys-universe/',
    '/storys-universe/index.html',
    '/storys-universe/manifest.json',
];

// 安裝事件：預先快取靜態資源
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // 立即啟用新的 service worker
    self.skipWaiting();
});

// 啟用事件：清理舊快取
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // 立即接管所有頁面
    self.clients.claim();
});

// 請求攔截：Network First 策略
self.addEventListener('fetch', (event) => {
    // 只處理 GET 請求
    if (event.request.method !== 'GET') return;

    // 跳過 blob URL（無法被 Service Worker 處理）
    if (event.request.url.startsWith('blob:')) return;

    // 跳過 API 請求和外部資源
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.includes('/api/') || url.pathname.includes('/supabase/')) return;

    event.respondWith(
        // Network First 策略：優先網路，失敗時使用快取
        fetch(event.request)
            .then((response) => {
                // 成功取得網路回應，更新快取
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 網路失敗，嘗試從快取取得
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // 如果快取也沒有，返回離線頁面 (對於 HTML 請求)
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/storys-universe/');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// 推播通知處理 (未來擴充用)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || '有新的故事等著你探索！',
        icon: '/storys-universe/icons/icon-192x192.png',
        badge: '/storys-universe/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/storys-universe/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Storys Universe', options)
    );
});

// 點擊通知處理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/storys-universe/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // 如果已有開啟的視窗，聚焦它
            for (const client of windowClients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // 否則開新視窗
            return clients.openWindow(url);
        })
    );
});

console.log('[SW] Service Worker loaded');
