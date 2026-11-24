// Mufti Abdus Sabur CRM service worker: push notifications
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'নতুন নোটিফিকেশন', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Mufti Abdus Sabur', {
    body: d.body || '', icon: '/icon.svg', badge: '/icon.svg', tag: d.tag, renotify: true, data: { url: d.url || '/' }, lang: 'bn',
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (c.url.startsWith(self.location.origin) && 'focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
