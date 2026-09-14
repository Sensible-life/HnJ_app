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

export interface Schedule {
  id: string;
  hotelId: string;
  assignedUserId: string;
  visitsPerMonth: number;
  nextVisitDate: string | null;
  lastVisitDate: string | null;
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
  byHotel: { hotelName: string; sessionCount: number; defectRate: number }[];
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
  createSchedule: (input: { hotelId: string; assignedUserId: string; visitsPerMonth: number }) =>
    request<Schedule>("/schedules", { method: "POST", body: JSON.stringify(input) }),
  reassignSchedule: (id: string, assignedUserId: string) =>
    request<Schedule>(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ assignedUserId }) }),
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
};
