self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (event) => {
    const url = './index.html';
    event.notification.close();
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Buscar cliente que ya esté en nuestra URL
        for (const client of clientList) {
            if (client.url.includes('index.html') && 'focus' in client) {
                return client.focus();
            }
        }
        // Si no hay cliente existente, abrir uno nuevo
        return self.clients.openWindow(url);
    }));
});
self.addEventListener('push', (event) => {
    const data = (() => { try { return event.data ? event.data.json() : {}; } catch { return {}; } })();
    const title = data.title || 'AgendaSmart';
    const options = { body: data.body || '', icon: data.icon || undefined, badge: data.badge || undefined, data: data.data || {} };
    event.waitUntil(self.registration.showNotification(title, options));
});
