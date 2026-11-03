/**
 * DASIG Portal — Unified Real Application Notification Engine
 * 
 * Functions like actual enterprise portals (GitHub, Google, Canvas):
 * 1. User-scoped storage: Notifications are keyed by account ID (or guest) so multiple accounts don't collide.
 * 2. Live synchronization: Merges personal security alerts (password resets, registrations) with live consortium announcements.
 * 3. Reactive dispatch: Dispatches custom DOM events ('dasig_notification_change') so the Nav bell updates instantly across all components.
 */

const NOTIFS_PREFIX = 'dasig_user_notifications_';

export function getNotificationsKey(userId) {
  return userId ? `${NOTIFS_PREFIX}${userId}` : `${NOTIFS_PREFIX}guest`;
}

/**
 * Retrieve all notifications for a specific user.
 */
export function getUserNotifications(userId) {
  try {
    const raw = localStorage.getItem(getNotificationsKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[notifications] Failed to read from storage:', err);
  }

  // Initial welcome notification for new/first-time users
  const initial = [
    {
      id: `welcome_${Date.now()}`,
      title: 'Welcome to DASIG Portal',
      msg: 'Consortium access is active. Explore events, research grants, and accredited faculty trainings.',
      time: 'Just now',
      timestamp: Date.now(),
      unread: true,
      category: 'System',
      path: '/programs?tab=events',
      isSecurity: false,
    }
  ];

  try {
    localStorage.setItem(getNotificationsKey(userId), JSON.stringify(initial));
  } catch (_) {}

  return initial;
}

/**
 * Add a new real-time notification to the user's feed.
 */
export function addNotification(userId, { title, msg, category = 'Update', path = '/', isSecurity = false }) {
  const current = getUserNotifications(userId);
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    msg,
    category,
    path,
    isSecurity,
    unread: true,
    time: 'Just now',
    timestamp: Date.now(),
  };

  // Prepend to list, keeping max 30 recent notifications
  const updated = [newNotif, ...current.filter(n => n.title !== title)].slice(0, 30);
  try {
    localStorage.setItem(getNotificationsKey(userId), JSON.stringify(updated));
    // Dispatch global event for instant UI sync
    window.dispatchEvent(new CustomEvent('dasig_notification_change', { detail: { userId, updated } }));
  } catch (err) {
    console.error('[notifications] Failed to save notification:', err);
  }

  return newNotif;
}

/**
 * Helper to record a security alert (e.g. password reset, email change)
 */
export function recordSecurityAlert(emailOrUserId, actionName) {
  const now = new Date();
  const timeFormatted = now.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return addNotification(emailOrUserId, {
    title: '🛡️ Security Alert: Password Updated',
    msg: `Your account password was successfully reset on ${timeFormatted}. If you did not make this change, contact consortium security immediately.`,
    category: 'Security',
    path: '/profile',
    isSecurity: true,
  });
}

/**
 * Save updated notification state (e.g., mark as read/unread)
 */
export function saveUserNotifications(userId, notifications) {
  try {
    localStorage.setItem(getNotificationsKey(userId), JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('dasig_notification_change', { detail: { userId, updated: notifications } }));
  } catch (err) {
    console.error('[notifications] Failed to update storage:', err);
  }
}

