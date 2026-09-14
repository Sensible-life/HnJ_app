import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("hnjapp.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL,
          parent_session_id TEXT,
          hotel_name TEXT NOT NULL DEFAULT '',
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
          photo_count INTEGER NOT NULL DEFAULT 0,
          repair_material TEXT,
          repair_cost INTEGER,
          revisit_date TEXT
        );
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY NOT NULL,
          item_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          local_uri TEXT NOT NULL,
          media_type TEXT NOT NULL DEFAULT 'GENERAL',
          hotel_name TEXT NOT NULL,
          room_label TEXT NOT NULL,
          captured_at TEXT NOT NULL,
          remote_url TEXT,
          synced INTEGER NOT NULL DEFAULT 0
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export interface LocalSession {
  id: string;
  parent_session_id: string | null;
  hotel_name: string;
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
  repair_material: string | null;
  repair_cost: number | null;
  revisit_date: string | null;
}

export interface LocalMedia {
  id: string;
  item_id: string;
  session_id: string;
  local_uri: string;
  media_type: "BEFORE" | "AFTER" | "GENERAL";
  hotel_name: string;
  room_label: string;
  captured_at: string;
  remote_url: string | null;
  synced: number;
}

export async function createSession(session: Omit<LocalSession, "synced">) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sessions (id, parent_session_id, hotel_name, room_label, type, status, checkin_method, gps_lat, gps_lng, started_at, completed_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      session.id,
      session.parent_session_id,
      session.hotel_name,
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
      `INSERT INTO inspection_items (id, session_id, item_def_id, item_name, state, comment, photo_count, repair_material, repair_cost, revisit_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.session_id,
        item.item_def_id,
        item.item_name,
        item.state,
        item.comment,
        item.photo_count,
        item.repair_material,
        item.repair_cost,
        item.revisit_date,
      ],
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

export async function updateItemRepairInfo(
  itemId: string,
  info: { repairMaterial: string | null; repairCost: number | null; revisitDate: string | null },
) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE inspection_items SET repair_material = ?, repair_cost = ?, revisit_date = ? WHERE id = ?`,
    [info.repairMaterial, info.repairCost, info.revisitDate, itemId],
  );
}

// FR-이슈트래커: 주의/긴급 항목을 세션 정보와 함께 조회 (진행중/완료/미완료 상태 추적용)
export interface IssueItemRow extends LocalItem {
  hotel_name: string;
  room_label: string;
  session_type: "ROOM_PRO" | "BATH_PRO";
  started_at: string;
}

export async function getIssueItems(): Promise<IssueItemRow[]> {
  const db = await getDb();
  return db.getAllAsync<IssueItemRow>(
    `SELECT i.*, s.hotel_name as hotel_name, s.room_label as room_label, s.type as session_type, s.started_at as started_at
     FROM inspection_items i
     JOIN sessions s ON s.id = i.session_id
     WHERE i.state IN ('CAUTION', 'URGENT')
     ORDER BY s.started_at DESC`,
  );
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

export async function insertMedia(media: Omit<LocalMedia, "remote_url" | "synced">) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO media (id, item_id, session_id, local_uri, media_type, hotel_name, room_label, captured_at, remote_url, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)`,
    [
      media.id,
      media.item_id,
      media.session_id,
      media.local_uri,
      media.media_type,
      media.hotel_name,
      media.room_label,
      media.captured_at,
    ],
  );
}

export async function getUnsyncedMedia(): Promise<LocalMedia[]> {
  const db = await getDb();
  return db.getAllAsync<LocalMedia>(`SELECT * FROM media WHERE synced = 0`);
}

export async function markMediaSynced(mediaId: string, remoteUrl: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE media SET synced = 1, remote_url = ? WHERE id = ?`, [remoteUrl, mediaId]);
}
