import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// FR: 기존에 앱을 설치해 로컬 SQLite 파일(hnjapp.db)이 이미 만들어진 기기에서는
// `CREATE TABLE IF NOT EXISTS`가 테이블을 다시 만들어주지 않아, 이후 버전에서 추가된 컬럼이
// 없는 채로 남는다("no such column" 에러의 원인). 기존 테이블에 없는 컬럼을 안전하게 추가한다.
async function ensureColumns(
  db: SQLite.SQLiteDatabase,
  table: string,
  columns: { name: string; ddl: string }[],
) {
  const existing = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  const existingNames = new Set(existing.map((c) => c.name));
  for (const col of columns) {
    if (!existingNames.has(col.name)) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${col.ddl}`);
    }
  }
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await ensureColumns(db, "sessions", [
    { name: "inspector_name", ddl: "inspector_name TEXT" },
    { name: "service_type", ddl: "service_type TEXT" },
    { name: "inspector_opinion", ddl: "inspector_opinion TEXT" },
    { name: "room_type", ddl: "room_type TEXT" },
    { name: "cleaning_team", ddl: "cleaning_team TEXT" },
    { name: "cleaning_completed_at", ddl: "cleaning_completed_at TEXT" },
    { name: "lost_item_found", ddl: "lost_item_found INTEGER NOT NULL DEFAULT 0" },
    { name: "lost_item_location", ddl: "lost_item_location TEXT" },
  ]);
  await ensureColumns(db, "inspection_items", [
    { name: "problem_description", ddl: "problem_description TEXT" },
    { name: "action_description", ddl: "action_description TEXT" },
    { name: "requires_hotel_approval", ddl: "requires_hotel_approval INTEGER NOT NULL DEFAULT 0" },
    { name: "issue_type", ddl: "issue_type TEXT" },
  ]);
  await ensureColumns(db, "media", [{ name: "media_kind", ddl: "media_kind TEXT NOT NULL DEFAULT 'IMAGE'" }]);
}

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
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

// FR: docs/FEATURE_SCOPE.md 우선순위 A — 서비스 구분(최초 리뉴얼/정기점검/긴급출동/재점검)
export type ServiceType = "INITIAL_RENEWAL" | "REGULAR" | "EMERGENCY" | "REINSPECTION";

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
  inspector_name: string | null;
  service_type: ServiceType | null;
  inspector_opinion: string | null;
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 객실 유형/청소 담당팀·완료시간/분실물
  room_type: string | null;
  cleaning_team: string | null;
  cleaning_completed_at: string | null;
  lost_item_found: number;
  lost_item_location: string | null;
}

export interface LocalItem {
  id: string;
  session_id: string;
  item_def_id: string;
  item_name: string;
  state: "UNSET" | "NORMAL" | "CAUTION" | "URGENT" | "NOT_APPLICABLE";
  comment: string | null;
  photo_count: number;
  repair_material: string | null;
  repair_cost: number | null;
  revisit_date: string | null;
  problem_description: string | null;
  action_description: string | null;
  requires_hotel_approval: number;
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 문제 유형(곰팡이/누수/악취 등)
  issue_type: string | null;
}

export interface LocalMedia {
  id: string;
  item_id: string;
  session_id: string;
  local_uri: string;
  media_type: "BEFORE" | "AFTER" | "GENERAL";
  // FR: docs/FEATURE_SCOPE.md 우선순위 C — 짧은 동영상 등록
  media_kind: "IMAGE" | "VIDEO";
  hotel_name: string;
  room_label: string;
  captured_at: string;
  remote_url: string | null;
  synced: number;
}

export async function createSession(session: Omit<LocalSession, "synced">) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sessions (id, parent_session_id, hotel_name, room_label, type, status, checkin_method, gps_lat, gps_lng, started_at, completed_at, synced, inspector_name, service_type, inspector_opinion, room_type, cleaning_team, cleaning_completed_at, lost_item_found, lost_item_location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      session.inspector_name,
      session.service_type,
      session.inspector_opinion,
      session.room_type,
      session.cleaning_team,
      session.cleaning_completed_at,
      session.lost_item_found ?? 0,
      session.lost_item_location,
    ],
  );
}

export async function insertItems(items: LocalItem[]) {
  const db = await getDb();
  for (const item of items) {
    await db.runAsync(
      `INSERT INTO inspection_items (id, session_id, item_def_id, item_name, state, comment, photo_count, repair_material, repair_cost, revisit_date, problem_description, action_description, requires_hotel_approval, issue_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        item.problem_description,
        item.action_description,
        item.requires_hotel_approval ?? 0,
        item.issue_type,
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

export async function getSession(sessionId: string): Promise<LocalSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalSession>(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
  return row ?? null;
}

// FR-홈: 홈 화면 "오늘 객실" 섹션 — 오늘(로컬 자정~다음 자정) 시작된 점검 세션을 실데이터로 조회.
export async function listTodaySessions(): Promise<LocalSession[]> {
  const db = await getDb();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return db.getAllAsync<LocalSession>(
    `SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at DESC`,
    [startOfDay, endOfDay],
  );
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

// FR: docs/FEATURE_SCOPE.md 우선순위 A — 문제 내용/조치 내용/호텔 승인 필요 여부
export async function updateItemProblemInfo(
  itemId: string,
  info: {
    problemDescription: string | null;
    actionDescription: string | null;
    requiresHotelApproval: boolean;
  },
) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE inspection_items SET problem_description = ?, action_description = ?, requires_hotel_approval = ? WHERE id = ?`,
    [info.problemDescription, info.actionDescription, info.requiresHotelApproval ? 1 : 0, itemId],
  );
}

// FR: docs/FEATURE_SCOPE.md 우선순위 A — 세션 완료 전 담당자 의견 입력
export async function updateSessionOpinion(sessionId: string, opinion: string | null) {
  const db = await getDb();
  await db.runAsync(`UPDATE sessions SET inspector_opinion = ? WHERE id = ?`, [opinion, sessionId]);
}

// FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소 완료시간/분실물 발견 여부·보관장소 (완료 전 입력)
export async function updateSessionOperationsInfo(
  sessionId: string,
  info: {
    roomType: string | null;
    cleaningTeam: string | null;
    cleaningCompletedAt: string | null;
    lostItemFound: boolean;
    lostItemLocation: string | null;
  },
) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE sessions SET room_type = ?, cleaning_team = ?, cleaning_completed_at = ?, lost_item_found = ?, lost_item_location = ? WHERE id = ?`,
    [
      info.roomType,
      info.cleaningTeam,
      info.cleaningCompletedAt,
      info.lostItemFound ? 1 : 0,
      info.lostItemLocation,
      sessionId,
    ],
  );
}

// FR: docs/FEATURE_SCOPE.md 우선순위 B — 항목별 문제 유형(곰팡이/누수/악취 등)
export async function updateItemIssueType(itemId: string, issueType: string | null) {
  const db = await getDb();
  await db.runAsync(`UPDATE inspection_items SET issue_type = ? WHERE id = ?`, [issueType, itemId]);
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
        OR i.requires_hotel_approval = 1
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
    `INSERT INTO media (id, item_id, session_id, local_uri, media_type, media_kind, hotel_name, room_label, captured_at, remote_url, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)`,
    [
      media.id,
      media.item_id,
      media.session_id,
      media.local_uri,
      media.media_type,
      media.media_kind ?? "IMAGE",
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
