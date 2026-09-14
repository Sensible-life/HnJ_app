// NestJS API 서버 베이스 URL.
// TODO: 실제 배포 시 환경변수(NEXT_PUBLIC_API_BASE_URL)로 분리
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export type Role = "INSPECTOR" | "HOTEL_MANAGER" | "HQ_ADMIN";

export interface Hotel {
  id: string;
  name: string;
  address: string;
  region: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  hotelIds: string[];
  createdAt: string;
}

export type ScheduleType = "INITIAL_RENEWAL" | "REGULAR" | "EMERGENCY" | "REINSPECTION";

export interface Schedule {
  id: string;
  hotelId: string;
  assignedUserId: string;
  visitsPerMonth: number;
  nextVisitDate: string | null;
  lastVisitDate: string | null;
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 긴급출동/재점검 일정 타입, 일정 공유
  scheduleType: ScheduleType;
  shareToken: string | null;
  hotel: Hotel | null;
  assignedUser: AdminUser | null;
  overdue: boolean;
}

export interface ReportItem {
  item_name: string;
  state: "UNSET" | "NORMAL" | "CAUTION" | "URGENT" | "NOT_APPLICABLE";
  comment?: string | null;
  photo_count?: number;
  repair_material?: string | null;
  repair_cost?: number | null;
  revisit_date?: string | null;
  problem_description?: string | null;
  action_description?: string | null;
  requires_hotel_approval?: boolean;
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 문제 유형(곰팡이/누수/악취 등)
  issue_type?: string | null;
}

export interface ReportSession {
  id: string;
  hotel_name: string;
  room_label: string;
  type: "ROOM_PRO" | "BATH_PRO";
  started_at: string;
  completed_at?: string | null;
  inspector_name?: string;
  service_type?: "INITIAL_RENEWAL" | "REGULAR" | "EMERGENCY" | "REINSPECTION";
  inspector_opinion?: string | null;
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 객실 유형/청소 담당팀·완료시간/분실물
  room_type?: string | null;
  cleaning_team?: string | null;
  cleaning_completed_at?: string | null;
  lost_item_found?: boolean;
  lost_item_location?: string | null;
}

export interface StoredInspection {
  session: ReportSession;
  items: ReportItem[];
  reportWebUrl?: string;
  reportPdfUrl?: string;
  syncedAt: string;
}

export interface MediaRecord {
  id: string;
  url: string;
  sessionId?: string;
  itemId?: string;
  itemName?: string;
  mediaType: "BEFORE" | "AFTER" | "GENERAL";
  // FR: docs/FEATURE_SCOPE.md 우선순위 C — 짧은 동영상 등록
  mediaKind?: "IMAGE" | "VIDEO";
  hotelName: string;
  roomLabel: string;
  capturedAt: string;
}

export interface DashboardStats {
  todayCompletedCount: number;
  monthCompletedCount: number;
  totalItemCount: number;
  urgentOpenCount: number;
  defectRatePercent: number;
  issueBreakdown: { itemName: string; caution: number; urgent: number }[];
  dailyTrend: { date: string; count: number }[];
  byHotel: { hotelName: string; sessionCount: number; badCount: number; defectRate: number; rank: number }[];
  // FR: docs/FEATURE_SCOPE.md 우선순위 B
  byInspector: { inspectorName: string; sessionCount: number; badCount: number; urgentCount: number; defectRate: number }[];
  byRoom: { hotelName: string; roomLabel: string; sessionCount: number; badCount: number }[];
  recurringIssues: { hotelName: string; roomLabel: string; itemName: string; count: number }[];
  improvementRatePercent: number | null;
  byCleaningTeam: { teamName: string; sessionCount: number; score: number | null }[];
  bathProTrend: { date: string; normal: number; caution: number; urgent: number }[];
}

export interface CleaningTeam {
  id: string;
  name: string;
}

export interface ServiceRate {
  id: string;
  hotelId: string | null;
  serviceType: ScheduleType;
  price: number;
  unit: string;
  note: string | null;
  updatedAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} 요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getHotels: () => request<Hotel[]>("/hotels"),
  getUsers: () => request<AdminUser[]>("/admin/users"),
  createUser: (input: { name: string; email: string; phone?: string; role: Role; hotelIds: string[] }) =>
    request<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(input) }),
  getSchedules: () => request<Schedule[]>("/schedules"),
  createSchedule: (input: {
    hotelId: string;
    assignedUserId: string;
    visitsPerMonth: number;
    scheduleType?: ScheduleType;
  }) => request<Schedule>("/schedules", { method: "POST", body: JSON.stringify(input) }),
  reassignSchedule: (id: string, assignedUserId: string) =>
    request<Schedule>(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ assignedUserId }) }),
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 호텔 담당자와 일정 공유
  getScheduleShareLink: (id: string) =>
    request<{ token: string; path: string }>(`/schedules/${id}/share-link`, { method: "POST" }),
  getStatsDashboard: () => request<DashboardStats>("/admin/stats/dashboard"),
  getInspectionsByRoom: (hotelName: string, roomLabel: string) =>
    request<StoredInspection[]>(
      `/inspections/room?hotelName=${encodeURIComponent(hotelName)}&roomLabel=${encodeURIComponent(roomLabel)}`,
    ),
  getInspections: () => request<StoredInspection[]>("/inspections"),
  getMediaByRoom: (hotelName: string, roomLabel: string) =>
    request<MediaRecord[]>(
      `/media?hotelName=${encodeURIComponent(hotelName)}&roomLabel=${encodeURIComponent(roomLabel)}`,
    ),
  // FR: docs/FEATURE_SCOPE.md 우선순위 C — PDF 공유 UX
  getReportShare: (sessionId: string) =>
    request<{ pdfUrl: string | null; webUrl: string | null; shareText: string }>(`/inspections/${sessionId}/share`),
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소 담당팀
  getCleaningTeams: () => request<CleaningTeam[]>("/cleaning-teams"),
  createCleaningTeam: (name: string) =>
    request<CleaningTeam>("/cleaning-teams", { method: "POST", body: JSON.stringify({ name }) }),
  // FR: docs/FEATURE_SCOPE.md 우선순위 C — 요금 관리
  getRates: () => request<ServiceRate[]>("/admin/rates"),
  createRate: (input: { hotelId?: string | null; serviceType: ScheduleType; price: number; unit?: string; note?: string }) =>
    request<ServiceRate>("/admin/rates", { method: "POST", body: JSON.stringify(input) }),
  updateRate: (id: string, input: { price?: number; unit?: string; note?: string }) =>
    request<ServiceRate>(`/admin/rates/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
};
