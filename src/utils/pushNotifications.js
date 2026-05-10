import API_URL from '../config';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  if ('serviceWorker' in navigator) {
    try {
      const register = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker Registered');

      // Chờ SW sẵn sàng
      await navigator.serviceWorker.ready;

      let subscription = await register.pushManager.getSubscription();

      if (!subscription) {
        subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
        console.log('Push Subscribed');
      }

      // Gửi subscription tới backend
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

    } catch (error) {
      console.error('Push Subscription Error:', error);
    }
  }
}
