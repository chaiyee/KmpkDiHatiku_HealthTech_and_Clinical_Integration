// Notification service: in-app reminders always work while the app is open.
// Browser notifications are shown only when the user grants permission.
// There is no background push service, so nothing is delivered when the browser is closed.

export type NotifyPermission = "granted" | "denied" | "default" | "unsupported";

export function notificationPermission(): NotifyPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (notificationPermission() === "unsupported") return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return notificationPermission();
  }
}

export function browserNotify(title: string, body: string): boolean {
  if (notificationPermission() !== "granted") return false;
  try {
    new Notification(title, { body, tag: title });
    return true;
  } catch {
    return false;
  }
}
