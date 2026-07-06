export const PERSISTENCE_VERSION = 1;

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  return safeParseJson<T>(window.localStorage.getItem(key));
}

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / serialization issues
  }
}

export function removeFromStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function userScopedKey(userId: string, name: string) {
  return `finoblik.v${PERSISTENCE_VERSION}.${userId}.${name}`;
}

