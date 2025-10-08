const DEFAULT_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    try {
      payload = { body: event.data.text() };
    } catch (err) {
      payload = {};
    }
  }

  const title = payload.title || 'Nexus';
  const body = payload.body || 'You have a new notification';
  const url = payload.url || (payload.data && payload.data.url) || DEFAULT_URL;

  const options = {
    body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || `nexus-notification-${Date.now()}`,
    requireInteraction: payload.requireInteraction || false,
    data: {
      url,
      ...payload.data
    },
    actions: payload.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    DEFAULT_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url === targetUrl || client.url === `${self.location.origin}${targetUrl}`) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
