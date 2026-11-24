'use strict';
self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/customer-portal/';
  event.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(clients) {
    for (var i=0; i<clients.length; i++) {
      if (clients[i].url.indexOf(self.location.origin) === 0 && 'focus' in clients[i]) {
        return clients[i].focus().then(function(client) { if ('navigate' in client) return client.navigate(target); });
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});
// Background push delivery is intentionally not configured until a VAPID sender is connected.
