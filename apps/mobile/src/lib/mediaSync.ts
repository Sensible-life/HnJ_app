import { getUnsyncedMedia, markMediaSynced, LocalMedia } from "./db";
import { isOnline } from "./sync";

const API_BASE_URL = "http://localhost:3001";

/**
 * FR-MED-01 연장: 촬영된 사진을 백그라운드로 서버에 업로드한다.
 * 워터마크 각인은 서버(sharp)에서 처리되므로, 클라이언트는 원본 + 메타데이터만 전송한다.
 */
export async function uploadPendingMedia(): Promise<{ uploaded: number; failed: number }> {
  const online = await isOnline();
  if (!online) return { uploaded: 0, failed: 0 };

  const pending = await getUnsyncedMedia();
  let uploaded = 0;
  let failed = 0;

  for (const media of pending) {
    try {
      await uploadOne(media);
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }

  return { uploaded, failed };
}

async function uploadOne(media: LocalMedia) {
  const form = new FormData();
  form.append("file", {
    uri: media.local_uri,
    name: `${media.id}.jpg`,
    type: "image/jpeg",
  } as unknown as Blob);
  form.append("hotelName", media.hotel_name);
  form.append("roomLabel", media.room_label);
  form.append("capturedAt", media.captured_at);

  const res = await fetch(`${API_BASE_URL}/media/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`media upload failed: ${res.status}`);
  const data = (await res.json()) as { url: string };
  await markMediaSynced(media.id, data.url);
}
