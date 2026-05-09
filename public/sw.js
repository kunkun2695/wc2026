// Service Worker cho World Cup 2026 Tracker
const CACHE_NAME = 'wc2026-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Để đơn giản, chúng ta không cache quá nhiều để tránh lỗi dữ liệu cũ
  event.respondWith(fetch(event.request));
});

// Xử lý thông báo đẩy (nếu có sau này)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: data.url
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
