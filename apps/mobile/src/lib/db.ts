import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("hnjapp.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL,
          room_label TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
          checkin_method TEXT NOT NULL,
          gps_lat REAL,
          gps_lng REAL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          synced INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS inspection_items (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          item_def_id TEXT NOT NULL,
          item_name TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'UNSET',
          comment TEXT,
          photo_count INTEGER NOT NULL DEFAULT 0
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export interface LocalSession {
  id: string;
  room_label: string;
  type: "ROOM_PRO" | "BATH_PRO";
  status: "IN_PROGRESS" | "COMPLETED";
  checkin_method: "QR" | "NFC" | "MANUAL";
  gps_lat: number | null;
  gps_lng: number | null;
  started_at: string;
  completed_at: string | null;
  synced: number;
}

export interface LocalItem {
  id: string;
  session_id: string;
  item_def_id: string;
  item_name: string;
  state: "UNSET" | "NORMAL" | "CAUTION" | "URGENT";
  comment: string | null;
  photo_count: number;
}

export async function createSession(session: Omit<LocalSession, "synced">) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sessions (id, room_label, type, status, checkin_method, gps_lat, gps_lng, started_at, completed_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      session.id,
      session.room_label,
      session.type,
      session.status,
      session.checkin_method,
      session.gps_lat,
      session.gps_lng,
      session.started_at,
      session.completed_at,
    ],
  );
}

export async function insertItems(items: LocalItem[]) {
  const db = await getDb();
  for (const item of items) {
    await db.runAsync(
      `INSERT INTO inspection_items (id, session_id, item_def_id, item_name, state, comment, photo_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.session_id, item.item_def_id, item.item_name, item.state, item.comment, item.photo_count],
    );
  }
}

export async function updateItemState(
  itemId: string,
  state: LocalItem["state"],
  photoCount?: number,
) {
  const db = await getDb();
  if (photoCount === undefined) {
    await db.runAsync(`UPDATE inspection_items SET state = ? WHERE id = ?`, [state, itemId]);
  } else {
    await db.runAsync(`UPDATE inspection_items SET state = ?, photo_count = ? WHERE id = ?`, [
      state,
      photoCount,
      itemId,
    ]);
  }
}

export async function getItemsForSession(sessionId: string): Promise<LocalItem[]> {
  const db = await getDb();
  return db.getAllAsync<LocalItem>(`SELECT * FROM inspection_items WHERE session_id = ?`, [sessionId]);
}

export async function completeSession(sessionId: string, completedAt: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE sessions SET status = 'COMPLETED', completed_at = ? WHERE id = ?`, [
    completedAt,
    sessionId,
  ]);
}

export async function getUnsyncedSessions(): Promise<LocalSession[]> {
  const db = await getDb();
  return db.getAllAsync<LocalSession>(`SELECT * FROM sessions WHERE synced = 0 AND status = 'COMPLETED'`);
}

export async function markSessionSynced(sessionId: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE sessions SET synced = 1 WHERE id = ?`, [sessionId]);
}
