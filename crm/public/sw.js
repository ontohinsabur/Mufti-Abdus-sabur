// Mufti Abdus Sabur CRM service worker: push notifications (sound + pop-up)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'নতুন নোটিফিকেশন', body: e.data && e.data.text() }; }
  const title = d.title || 'Mufti Abdus Sabur';
  e.waitUntil((async () => {
    // tell open app windows, so they play their own "ting" and show the in-app pop-up
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    list.forEach((c) => c.postMessage({ type: 'push', n: { id: d.id || (d.tag && d.tag.length >= 36 ? d.tag.slice(-36) : d.tag) || String(Date.now()), title, body: d.body || '', url: d.url || '/' } }));
    // system notification: makes the phone's notification sound and shows the heads-up pop-up
    await self.registration.showNotification(title, {
      body: d.body || '', icon: '/icon.svg', badge: '/icon.svg', tag: d.tag || d.id || undefined, renotify: true,
      silent: false, requireInteraction: false, vibrate: [200, 100, 200], timestamp: Date.now(),
      data: { url: d.url || '/' }, lang: 'bn',
    });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (c.url.startsWith(self.location.origin) && 'focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
