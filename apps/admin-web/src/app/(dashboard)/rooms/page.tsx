"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { api, API_BASE_URL, StoredInspection, MediaRecord } from "../../../lib/api";
import { BeforeAfterSlider } from "./components/BeforeAfterSlider";
import { QuickDrawCanvas } from "./components/QuickDrawCanvas";

const STATE_LABEL: Record<string, string> = { NORMAL: "정상", CAUTION: "주의", URGENT: "긴급", UNSET: "미점검" };
const STATE_TONE: Record<string, string> = {
  NORMAL: "bg-status-success-bg text-status-success",
  CAUTION: "bg-primary-soft text-primary",
  URGENT: "bg-status-urgent-bg text-status-urgent",
  UNSET: "bg-background-subtle text-foreground-secondary",
};

function mediaUrl(m: MediaRecord) {
  return `${API_BASE_URL}${m.url}`;
}

// FR: "객실 타임라인 피드 + Before/After 스플릿 슬라이더" + "Quick-Draw 마킹 도구" — TODO.md Phase 6
export default function RoomsPage() {
  const [rooms, setRooms] = useState<{ hotelName: string; roomLabel: string }[]>([]);
  const [selected, setSelected] = useState<{ hotelName: string; roomLabel: string } | null>(null);
  const [timeline, setTimeline] = useState<StoredInspection[]>([]);
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickDrawTarget, setQuickDrawTarget] = useState<MediaRecord | null>(null);

  useEffect(() => {
    api
      .getInspections()
      .then((list) => {
        const seen = new Set<string>();
        const unique: { hotelName: string; roomLabel: string }[] = [];
        for (const r of list) {
          const key = `${r.session.hotel_name}__${r.session.room_label}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push({ hotelName: r.session.hotel_name, roomLabel: r.session.room_label });
        }
        setRooms(unique);
        if (unique.length > 0) setSelected(unique[0]);
        setError(null);
      })
      .catch(() => setError("API 서버(localhost:3001)에 연결할 수 없어요. 서버를 실행한 뒤 새로고침 해주세요."))
      .finally(() => setLoadingRooms(false));
  }, []);

  const loadDetail = useCallback(async (room: { hotelName: string; roomLabel: string }) => {
    setLoadingDetail(true);
    try {
      const [t, m] = await Promise.all([
        api.getInspectionsByRoom(room.hotelName, room.roomLabel),
        api.getMediaByRoom(room.hotelName, room.roomLabel),
      ]);
      setTimeline(t);
      setMedia(m);
      setQuickDrawTarget(m[0] ?? null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 선택된 객실이 바뀔 때 상세 데이터 로드(표준 패턴)
    if (selected) loadDetail(selected);
  }, [selected, loadDetail]);

  const beforeAfterPair = useMemo(() => {
    const before = media.find((m) => m.mediaType === "BEFORE");
    const after = media.find((m) => m.mediaType === "AFTER");
    return before && after ? { before, after } : null;
  }, [media]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground">객실 타임라인</h1>
      <p className="mt-1 text-sm text-foreground-secondary">
        객실별 점검 이력, Before/After 비교, 사진 마킹을 확인하세요
      </p>

      {error && <p className="mt-4 rounded-xl bg-status-urgent-bg px-4 py-3 text-sm text-status-urgent">{error}</p>}

      {!loadingRooms && rooms.length === 0 && !error && (
        <p className="mt-6 rounded-[20px] bg-white p-6 text-sm text-foreground-secondary shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          아직 동기화된 점검 데이터가 없어요. 모바일 앱에서 점검을 완료하면 여기에 표시돼요.
        </p>
      )}

      {rooms.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {rooms.map((r) => {
            const active = selected?.hotelName === r.hotelName && selected?.roomLabel === r.roomLabel;
            return (
              <button
                key={`${r.hotelName}__${r.roomLabel}`}
                onClick={() => setSelected(r)}
                className={
                  active
                    ? "rounded-full bg-nav-active-bg px-4 py-2 text-xs font-semibold text-white"
                    : "rounded-full bg-white px-4 py-2 text-xs font-medium text-foreground-secondary shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                }
              >
                {r.hotelName} · {r.roomLabel}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <>
          {beforeAfterPair && (
            <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-semibold text-foreground">Before / After 비교</h2>
              <p className="text-xs text-foreground-secondary">슬라이더를 드래그해서 작업 전/후를 비교하세요</p>
              <div className="mt-4 max-w-md">
                <BeforeAfterSlider beforeUrl={mediaUrl(beforeAfterPair.before)} afterUrl={mediaUrl(beforeAfterPair.after)} />
              </div>
            </section>
          )}

          {media.length > 0 && (
            <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-semibold text-foreground">Quick-Draw 마킹 도구</h2>
              <p className="text-xs text-foreground-secondary">사진을 선택하고 이슈 부위에 화살표/원으로 표시하세요</p>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {media.map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    src={mediaUrl(m)}
                    alt={m.itemName ?? "점검 사진"}
                    onClick={() => setQuickDrawTarget(m)}
                    className={
                      quickDrawTarget?.id === m.id
                        ? "h-16 w-16 shrink-0 cursor-pointer rounded-lg object-cover ring-2 ring-primary"
                        : "h-16 w-16 shrink-0 cursor-pointer rounded-lg object-cover opacity-70"
                    }
                  />
                ))}
              </div>
              {quickDrawTarget && (
                <div className="mt-4 max-w-md">
                  <QuickDrawCanvas key={quickDrawTarget.id} imageUrl={mediaUrl(quickDrawTarget)} />
                </div>
              )}
            </section>
          )}

          <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-semibold text-foreground">점검 타임라인</h2>
            {loadingDetail ? (
              <p className="mt-4 text-sm text-foreground-secondary">불러오는 중...</p>
            ) : timeline.length === 0 ? (
              <p className="mt-4 text-sm text-foreground-secondary">이 객실의 점검 이력이 없어요.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-5">
                {timeline.map((t) => (
                  <div key={t.session.id} className="border-l-2 border-background-subtle pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {t.session.type === "BATH_PRO" ? "🛁 BATH PRO" : "🛏 ROOM PRO"}
                      </span>
                      <span className="text-xs text-foreground-secondary">
                        {(t.session.completed_at ?? t.syncedAt).replace("T", " ").slice(0, 16)}
                      </span>
                      {t.reportWebUrl && (
                        <a
                          href={`${API_BASE_URL}${t.reportWebUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-primary underline"
                        >
                          리포트 보기 ↗
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.items
                        .filter((i) => i.state !== "UNSET")
                        .map((i) => (
                          <span
                            key={i.item_name}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_TONE[i.state]}`}
                            title={i.item_name}
                          >
                            {i.item_name.length > 8 ? `${i.item_name.slice(0, 8)}…` : i.item_name} · {STATE_LABEL[i.state]}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
