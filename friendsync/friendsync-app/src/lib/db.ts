/*
  db.ts — Auto-detecting DB adapter.

  Strategy:
  - Try to use native `expo-sqlite` if available and the opened DB exposes the classic
    `transaction` API. If so, delegate SQL to native.
  - Otherwise fall back to a JS-backed table store persisted via `src/lib/storage.ts`.

  Import this module from app code (e.g. `import db from './lib/db'`).
*/

import { Platform } from 'react-native';
import storage from './storage';

// Storage key for fallback DB
const FALLBACK_KEY = 'fallback_db_v1';

// Native DB references
let nativeDb: any = null;
let useNative = false;

async function tryInitNative() {
  if (useNative || Platform.OS === 'web') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite: any = require('expo-sqlite');
    let dbHandle: any = null;
    if (typeof SQLite.openDatabaseSync === 'function') {
      dbHandle = SQLite.openDatabaseSync('friendsync.db');
    } else if (typeof SQLite.openDatabase === 'function') {
      dbHandle = SQLite.openDatabase('friendsync.db');
    }

    // detect the classic API
    if (dbHandle && typeof dbHandle.transaction === 'function') {
      nativeDb = dbHandle;
      useNative = true;
      console.log('db: using native expo-sqlite implementation');
    } else {
      console.log('db: native expo-sqlite available but does not expose transaction() - falling back to JS store');
    }
  } catch (e) {
    // module not available or require failed -> fallback
    // console.log('db: native sqlite not available', e?.message ?? e);
  }
}

// ------------------------
// Fallback JS DB implementation
// ------------------------
type Row = { [k: string]: any };
type DBShape = {
  __meta__: { nextId: { [table: string]: number } };
  user: Row[];
  friend_requests: Row[];
  events: Row[];
  free_time: Row[];
  notifications: Row[];
  user_preferences: Row[];
};

async function loadFallback(): Promise<DBShape> {
  const val = await storage.getItem<DBShape>(FALLBACK_KEY);
  if (val) return val;
  const initial: DBShape = {
    __meta__: { nextId: {} },
    user: [],
    friend_requests: [],
    events: [],
    free_time: [],
    notifications: [],
    user_preferences: [],
  };
  await storage.setItem(FALLBACK_KEY, initial);
  return initial;
}

async function saveFallback(db: DBShape) {
  await storage.setItem(FALLBACK_KEY, db);
}

function nextId(db: DBShape, table: keyof DBShape): number {
  const n = db.__meta__.nextId[table as string] ?? 1;
  db.__meta__.nextId[table as string] = n + 1;
  return n;
}

// ------------------------
// Native helpers
// ------------------------
function execSqlNative(database: any, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!database || typeof database.transaction !== 'function') return reject(new Error('Invalid native DB handle'));
    database.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve(result),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    }, (txErr: any) => reject(txErr));
  });
}

// ------------------------
// Public API: functions that choose native vs fallback
// ------------------------

export async function init_db() {
  await tryInitNative();
  // nothing to create for fallback beyond the stored shape
  if (!useNative) {
    await loadFallback();
  }
  return true;
}

// Users
export async function createUser(user: { username: string; email: string; password: string; phone_number?: string | null; }): Promise<number> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'INSERT INTO user (username, email, password, phone_number) VALUES (?, ?, ?, ?);', [user.username, user.email, user.password, user.phone_number ?? null]);
    return res.insertId ?? 0;
  }
  const db = await loadFallback();
  const id = nextId(db, 'user');
  db.user.push({ id, username: user.username, email: user.email, password: user.password, phone_number: user.phone_number ?? null });
  await saveFallback(db);
  return id;
}

export async function getUserById(id: number): Promise<any | null> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'SELECT * FROM user WHERE id = ?;', [id]);
    return (res.rows && res.rows._array && res.rows._array[0]) ?? null;
  }
  const db = await loadFallback();
  return db.user.find(u => u.id === id) ?? null;
}

export async function getUserByUsername(username: string): Promise<any | null> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'SELECT * FROM user WHERE username = ?;', [username]);
    return (res.rows && res.rows._array && res.rows._array[0]) ?? null;
  }
  const db = await loadFallback();
  return db.user.find(u => u.username === username) ?? null;
}

export async function updateUser(id: number, fields: { username?: string; email?: string; password?: string; phone_number?: string | null }) {
  await tryInitNative();
  if (useNative && nativeDb) {
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.username !== undefined) { sets.push('username = ?'); params.push(fields.username); }
    if (fields.email !== undefined) { sets.push('email = ?'); params.push(fields.email); }
    if (fields.password !== undefined) { sets.push('password = ?'); params.push(fields.password); }
    if (fields.phone_number !== undefined) { sets.push('phone_number = ?'); params.push(fields.phone_number); }
    if (sets.length === 0) return;
    params.push(id);
    const sql = `UPDATE user SET ${sets.join(', ')} WHERE id = ?;`;
    await execSqlNative(nativeDb, sql, params);
    return;
  }
  const db = await loadFallback();
  const idx = db.user.findIndex(u => u.id === id);
  if (idx === -1) return;
  db.user[idx] = { ...db.user[idx], ...fields };
  await saveFallback(db);
}

export async function deleteUser(id: number) {
  await tryInitNative();
  if (useNative && nativeDb) {
    await execSqlNative(nativeDb, 'DELETE FROM user WHERE id = ?;', [id]);
    return;
  }
  const db = await loadFallback();
  db.user = db.user.filter(u => u.id !== id);
  db.friend_requests = db.friend_requests.filter(r => r.sender_id !== id && r.receiver_id !== id);
  db.events = db.events.filter(e => e.user_id !== id);
  db.free_time = db.free_time.filter(f => f.user_id !== id);
  db.notifications = db.notifications.filter(n => n.user_id !== id);
  db.user_preferences = db.user_preferences.filter(p => p.user_id !== id);
  await saveFallback(db);
}

// Friend requests & friends
export async function sendFriendRequest(senderId: number, receiverId: number): Promise<number> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, "INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending');", [senderId, receiverId]);
    return res.insertId ?? 0;
  }
  const db = await loadFallback();
  const id = nextId(db, 'friend_requests');
  db.friend_requests.push({ request_id: id, sender_id: senderId, receiver_id: receiverId, status: 'pending' });
  await saveFallback(db);
  return id;
}

export async function respondFriendRequest(requestId: number, accept: boolean) {
  await tryInitNative();
  if (useNative && nativeDb) {
    const status = accept ? 'accepted' : 'rejected';
    await execSqlNative(nativeDb, 'UPDATE friend_requests SET status = ? WHERE request_id = ?;', [status, requestId]);
    return;
  }
  const db = await loadFallback();
  const r = db.friend_requests.find(rr => rr.request_id === requestId);
  if (!r) return;
  r.status = accept ? 'accepted' : 'rejected';
  await saveFallback(db);
}

export async function getFriendRequestsForUser(userId: number): Promise<any[]> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, "SELECT * FROM friend_requests WHERE receiver_id = ? AND status = 'pending';", [userId]);
    return res.rows._array as any[];
  }
  const db = await loadFallback();
  return db.friend_requests.filter(r => r.receiver_id === userId && r.status === 'pending');
}

export async function getFriendsForUser(userId: number): Promise<number[]> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, `
        SELECT
            CASE
                WHEN sender_id = ? THEN receiver_id
                ELSE sender_id
            END AS friend_id
        FROM friend_requests
        WHERE status = 'accepted' AND (sender_id = ? OR receiver_id = ?);
    `, [userId, userId, userId]);
    return (res.rows._array as any[]).map((r) => r.friend_id as number);
  }
  const db = await loadFallback();
  const accepted = db.friend_requests.filter(r => r.status === 'accepted' && (r.sender_id === userId || r.receiver_id === userId));
  return accepted.map(r => (r.sender_id === userId ? r.receiver_id : r.sender_id));
}

export async function removeFriend(userA: number, userB: number) {
  await tryInitNative();
  if (useNative && nativeDb) {
    await execSqlNative(nativeDb, `
        DELETE FROM friend_requests
        WHERE status = 'accepted' AND
            ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?));
    `, [userA, userB, userB, userA]);
    return;
  }
  const db = await loadFallback();
  db.friend_requests = db.friend_requests.filter(r => !(r.status === 'accepted' && ((r.sender_id === userA && r.receiver_id === userB) || (r.sender_id === userB && r.receiver_id === userA))));
  await saveFallback(db);
}

// Events
export async function createEvent(event: { user_id: number; title: string; description?: string; start_time: string; end_time?: string; }): Promise<number> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'INSERT INTO events (user_id, title, description, start_time, end_time) VALUES (?, ?, ?, ?, ?);', [event.user_id, event.title, event.description ?? null, event.start_time, event.end_time ?? null]);
    return res.insertId ?? 0;
  }
  const db = await loadFallback();
  const id = nextId(db, 'events');
  db.events.push({ event_id: id, user_id: event.user_id, title: event.title, description: event.description ?? null, start_time: event.start_time, end_time: event.end_time ?? null });
  await saveFallback(db);
  return id;
}

export async function getEventsForUser(userId: number): Promise<any[]> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'SELECT * FROM events WHERE user_id = ? ORDER BY start_time;', [userId]);
    return res.rows._array as any[];
  }
  const db = await loadFallback();
  return db.events.filter(e => e.user_id === userId).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export async function deleteEvent(eventId: number) {
  await tryInitNative();
  if (useNative && nativeDb) {
    await execSqlNative(nativeDb, 'DELETE FROM events WHERE event_id = ?;', [eventId]);
    return;
  }
  const db = await loadFallback();
  db.events = db.events.filter(e => e.event_id !== eventId);
  await saveFallback(db);
}

// Free time
export async function addFreeTime(slot: { user_id: number; start_time: string; end_time?: string; }): Promise<number> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'INSERT INTO free_time (user_id, start_time, end_time) VALUES (?, ?, ?);', [slot.user_id, slot.start_time, slot.end_time ?? null]);
    return res.insertId ?? 0;
  }
  const db = await loadFallback();
  const id = nextId(db, 'free_time');
  db.free_time.push({ free_time_id: id, user_id: slot.user_id, start_time: slot.start_time, end_time: slot.end_time ?? null });
  await saveFallback(db);
  return id;
}

export async function getFreeTimeForUser(userId: number): Promise<any[]> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'SELECT * FROM free_time WHERE user_id = ? ORDER BY start_time;', [userId]);
    return res.rows._array as any[];
  }
  const db = await loadFallback();
  return db.free_time.filter(f => f.user_id === userId).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

// Notifications
export async function addNotification(note: { user_id: number; message: string; timestamp?: string; }): Promise<number> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'INSERT INTO notifications (user_id, message, timestamp) VALUES (?, ?, ?);', [note.user_id, note.message, note.timestamp ?? new Date().toISOString()]);
    return res.insertId ?? 0;
  }
  const db = await loadFallback();
  const id = nextId(db, 'notifications');
  db.notifications.push({ notification_id: id, user_id: note.user_id, message: note.message, timestamp: note.timestamp ?? new Date().toISOString() });
  await saveFallback(db);
  return id;
}

export async function getNotificationsForUser(userId: number): Promise<any[]> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC;', [userId]);
    return res.rows._array as any[];
  }
  const db = await loadFallback();
  return db.notifications.filter(n => n.user_id === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function clearNotificationsForUser(userId: number) {
  await tryInitNative();
  if (useNative && nativeDb) {
    await execSqlNative(nativeDb, 'DELETE FROM notifications WHERE user_id = ?;', [userId]);
    return;
  }
  const db = await loadFallback();
  db.notifications = db.notifications.filter(n => n.user_id !== userId);
  await saveFallback(db);
}

// Preferences
export async function setUserPreferences(userId: number, prefs: { theme?: number; notifications_enabled?: number; color_scheme?: number; }) {
  await tryInitNative();
  if (useNative && nativeDb) {
    const existing: any = await execSqlNative(nativeDb, 'SELECT * FROM user_preferences WHERE user_id = ?;', [userId]);
    if ((existing.rows._array as any[]).length > 0) {
      const sets: string[] = [];
      const params: any[] = [];
      if (prefs.theme !== undefined) { sets.push('theme = ?'); params.push(prefs.theme); }
      if (prefs.notifications_enabled !== undefined) { sets.push('notifications_enabled = ?'); params.push(prefs.notifications_enabled); }
      if (prefs.color_scheme !== undefined) { sets.push('color_scheme = ?'); params.push(prefs.color_scheme); }
      if (sets.length === 0) return;
      params.push(userId);
      await execSqlNative(nativeDb, `UPDATE user_preferences SET ${sets.join(', ')} WHERE user_id = ?;`, params);
    } else {
      await execSqlNative(nativeDb, 'INSERT INTO user_preferences (user_id, theme, notifications_enabled, color_scheme) VALUES (?, ?, ?, ?);', [userId, prefs.theme ?? 0, prefs.notifications_enabled ?? 1, prefs.color_scheme ?? 0]);
    }
    return;
  }
  const db = await loadFallback();
  const idx = db.user_preferences.findIndex(p => p.user_id === userId);
  if (idx !== -1) {
    db.user_preferences[idx] = { ...db.user_preferences[idx], ...prefs };
  } else {
    db.user_preferences.push({ preference_id: nextId(db, 'user_preferences'), user_id: userId, theme: prefs.theme ?? 0, notifications_enabled: prefs.notifications_enabled ?? 1, color_scheme: prefs.color_scheme ?? 0 });
  }
  await saveFallback(db);
}

export async function getUserPreferences(userId: number): Promise<any | null> {
  await tryInitNative();
  if (useNative && nativeDb) {
    const res: any = await execSqlNative(nativeDb, 'SELECT * FROM user_preferences WHERE user_id = ?;', [userId]);
    return (res.rows._array as any[])[0] ?? null;
  }
  const db = await loadFallback();
  return db.user_preferences.find(p => p.user_id === userId) ?? null;
}

export default {
  init_db,
  createUser,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  sendFriendRequest,
  respondFriendRequest,
  getFriendRequestsForUser,
  getFriendsForUser,
  removeFriend,
  createEvent,
  getEventsForUser,
  deleteEvent,
  addFreeTime,
  getFreeTimeForUser,
  addNotification,
  getNotificationsForUser,
  clearNotificationsForUser,
  setUserPreferences,
  getUserPreferences,
};
