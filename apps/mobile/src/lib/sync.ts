import * as Network from "expo-network";
import { getUnsyncedSessions, getItemsForSession, markSessionSynced } from "./db";

// TODO: 실제 배포 시 환경변수/설정으로 분리
const API_BASE_URL = "http://localhost:3001";

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

/**
 * 오프라인 중 로컬 SQLite에 쌓인 완료 세션을 서버로 동기화한다.
 * FR-INSP-05 (오프라인 임시 저장 및 재연결 시 자동 동기화) 대응.
 */
export async function syncPendingSessions(): Promise<{ synced: number; failed: number }> {
  const online = await isOnline();
  if (!online) return { synced: 0, failed: 0 };

  const pending = await getUnsyncedSessions();
  let synced = 0;
  let failed = 0;

  for (const session of pending) {
    try {
      const items = await getItemsForSession(session.id);
      // SQLite에는 requires_hotel_approval 이 0/1 정수로 저장되므로, 서버 DTO(boolean)와 맞춰 변환해서 보낸다.
      const payloadItems = items.map((item) => ({
        ...item,
        requires_hotel_approval: item.requires_hotel_approval === 1,
      }));
      // 마찬가지로 lost_item_found 도 0/1 정수 → boolean 변환
      const payloadSession = { ...session, lost_item_found: session.lost_item_found === 1 };
      const res = await fetch(`${API_BASE_URL}/inspections/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientUuid: session.id, session: payloadSession, items: payloadItems }),
      });
      if (!res.ok) throw new Error(`sync failed: ${res.status}`);
      await markSessionSynced(session.id);
      synced += 1;
    } catch (err) {
      // 네트워크가 있어도 서버 오류일 수 있으니 이 세션만 건너뛰고 계속 진행
      failed += 1;
    }
  }

  return { synced, failed };
}
