import AsyncStorage from "@react-native-async-storage/async-storage";

/*
 * Remembers, per account on this phone, which notifications were deleted or
 * read. Some notifications are rebuilt on every refresh (nearby facilities,
 * listing updates), so without this they came back after being deleted and
 * showed as unread again after "Mark all as read".
 *
 * Keys include the notification's time, so a newer message in the same chat
 * shows up again even if the older one was deleted.
 */

type Notif = { id: string; type?: string; timestamp?: number; read?: boolean };

const MAX_KEYS = 500;

const storageKey = (kind: "dismissed" | "read", ownerId: string) =>
  `notif_${kind}_${ownerId}`;

// Nearby-facility items get a new timestamp on every refresh, so use the id alone
export const notificationKey = (n: Notif) =>
  n.type === "facility_nearby" ? n.id : `${n.id}@${n.timestamp ?? 0}`;

const loadKeys = async (key: string): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const addKeys = async (key: string, newKeys: string[]) => {
  try {
    const existing = await loadKeys(key);
    const merged = Array.from(new Set([...existing, ...newKeys]));
    await AsyncStorage.setItem(key, JSON.stringify(merged.slice(-MAX_KEYS)));
  } catch (error) {
    console.log("SAVE NOTIFICATION STATE ERROR:", error);
  }
};

// Drops deleted notifications and marks remembered ones as read
export async function applyNotificationState<T extends Notif>(
  ownerId: string,
  items: T[],
): Promise<T[]> {
  if (!ownerId) return items;

  const dismissed = new Set(await loadKeys(storageKey("dismissed", ownerId)));
  const read = new Set(await loadKeys(storageKey("read", ownerId)));

  return items
    .filter((n) => !dismissed.has(notificationKey(n)))
    .map((n) => (read.has(notificationKey(n)) ? { ...n, read: true } : n));
}

export const rememberDismissed = (ownerId: string, items: Notif[]) =>
  ownerId
    ? addKeys(storageKey("dismissed", ownerId), items.map(notificationKey))
    : Promise.resolve();

export const rememberRead = (ownerId: string, items: Notif[]) =>
  ownerId
    ? addKeys(storageKey("read", ownerId), items.map(notificationKey))
    : Promise.resolve();
