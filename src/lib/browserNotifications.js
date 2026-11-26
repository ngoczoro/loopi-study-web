/**
 * System notifications (the operating system's popups), for things worth seeing while
 * Loopi is in a background tab, such as a group call starting.
 */

const supported = () => typeof window !== "undefined" && "Notification" in window;

/** "unsupported", or the browser's answer so far: "default" (not asked), "granted", "denied". */
export function notificationPermission() {
  return supported() ? Notification.permission : "unsupported";
}

/**
 * Asks once and resolves to the new permission. Call it from a click, since browsers
 * ignore or hide requests made without one.
 */
export async function askNotificationPermission() {
  if (!supported() || Notification.permission !== "default") return notificationPermission();
  try {
    return (await Notification.requestPermission()) ?? notificationPermission();
  } catch {
    // Old Safari only has the callback form; not worth supporting.
    return notificationPermission();
  }
}

/**
 * Shows a system notification if the user allowed them and is not looking at Loopi.
 * `tag` replaces an earlier notification with the same tag instead of stacking.
 */
export function showSystemNotification(title, { body, tag, onClick } = {}) {
  if (!supported() || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible" && document.hasFocus()) return;
  try {
    const notification = new Notification(title, { body, tag, icon: "/favicon.svg" });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
