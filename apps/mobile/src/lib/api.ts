// FR: docs/FEATURE_SCOPE.md 우선순위 A — 체크인 시 실제 호텔/담당자 선택 흐름을 위한 최소 API 클라이언트
const API_BASE_URL = "http://localhost:3001";

export interface ApiHotel {
  id: string;
  name: string;
}

export interface ApiUser {
  id: string;
  name: string;
  role: string;
}

export async function fetchHotels(): Promise<ApiHotel[]> {
  const res = await fetch(`${API_BASE_URL}/hotels`);
  if (!res.ok) throw new Error(`hotels fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchInspectors(): Promise<ApiUser[]> {
  const res = await fetch(`${API_BASE_URL}/admin/users`);
  if (!res.ok) throw new Error(`users fetch failed: ${res.status}`);
  const users: ApiUser[] = await res.json();
  return users.filter((u) => u.role === "INSPECTOR");
}

// FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소 담당팀 선택
export interface ApiCleaningTeam {
  id: string;
  name: string;
}

export async function fetchCleaningTeams(): Promise<ApiCleaningTeam[]> {
  const res = await fetch(`${API_BASE_URL}/cleaning-teams`);
  if (!res.ok) throw new Error(`cleaning-teams fetch failed: ${res.status}`);
  return res.json();
}
