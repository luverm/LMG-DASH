export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

/** Shows a system notification, but only when the app isn't in view (it has its own toasts). */
export function notify(title: string, body?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible' && document.hasFocus()) return
  try {
    new Notification(title, {
      body,
      tag: 'lmg-dash',
      icon: `${import.meta.env.BASE_URL}icon-192.png`,
    })
  } catch {
    // Some browsers only allow notifications from a service worker.
  }
}
