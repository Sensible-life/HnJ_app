"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Hotel, ServiceRate, ScheduleType, CleaningTeam } from "../../../lib/api";

const SERVICE_TYPE_LABEL: Record<ScheduleType, string> = {
  INITIAL_RENEWAL: "최초 리뉴얼",
  REGULAR: "정기점검",
  EMERGENCY: "긴급출동",
  REINSPECTION: "재점검",
};
const SERVICE_TYPES: ScheduleType[] = ["REGULAR", "EMERGENCY", "REINSPECTION", "INITIAL_RENEWAL"];

// FR: docs/FEATURE_SCOPE.md 우선순위 C — 요금 관리 (서비스 유형별/호텔별 요금 설정)
export default function RatesPage() {
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소 담당팀 등록
  const [cleaningTeams, setCleaningTeams] = useState<CleaningTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  const [formHotelId, setFormHotelId] = useState<string>("");
  const [formServiceType, setFormServiceType] = useState<ScheduleType>("REGULAR");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formUnit, setFormUnit] = useState("건당");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editUnit, setEditUnit] = useState("");
  const [editNote, setEditNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [r, h, ct] = await Promise.all([api.getRates(), api.getHotels(), api.getCleaningTeams()]);
      setRates(r);
      setHotels(h);
      setCleaningTeams(ct);
      setError(null);
    } catch {
      setError("API 서버(localhost:3001)에 연결할 수 없어요. 서버를 실행한 뒤 새로고침 해주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 1회 데이터 로드(표준 패턴)
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createRate({
        hotelId: formHotelId || null,
        serviceType: formServiceType,
        price: formPrice,
        unit: formUnit,
        note: formNote || undefined,
      });
      setFormPrice(0);
      setFormNote("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(rate: ServiceRate) {
    setEditingId(rate.id);
    setEditPrice(rate.price);
    setEditUnit(rate.unit);
    setEditNote(rate.note ?? "");
  }

  async function saveEdit(id: string) {
    await api.updateRate(id, { price: editPrice, unit: editUnit, note: editNote });
    setEditingId(null);
    await load();
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamSubmitting(true);
    try {
      await api.createCleaningTeam(newTeamName.trim());
      setNewTeamName("");
      await load();
    } finally {
      setTeamSubmitting(false);
    }
  }

  function hotelName(hotelId: string | null) {
    if (!hotelId) return "전체 기본 요금";
    return hotels.find((h) => h.id === hotelId)?.name ?? hotelId;
  }

  const defaultRates = rates.filter((r) => !r.hotelId);
  const hotelRates = rates.filter((r) => r.hotelId);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground">요금 관리</h1>
      <p className="mt-1 text-sm text-foreground-secondary">서비스 유형별 기본 요금과 호텔별 요금을 설정하세요</p>

      {error && <p className="mt-4 rounded-xl bg-status-urgent-bg px-4 py-3 text-sm text-status-urgent">{error}</p>}

      <form onSubmit={handleCreate} className="mt-8 flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">호텔 (선택 안 하면 전체 기본 요금)</label>
          <select
            className="rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formHotelId}
            onChange={(e) => setFormHotelId(e.target.value)}
          >
            <option value="">전체 기본 요금</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">서비스 유형</label>
          <select
            className="rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formServiceType}
            onChange={(e) => setFormServiceType(e.target.value as ScheduleType)}
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SERVICE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">요금 (원)</label>
          <input
            type="number"
            min={0}
            className="w-32 rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formPrice}
            onChange={(e) => setFormPrice(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">단위</label>
          <input
            type="text"
            className="w-24 rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formUnit}
            onChange={(e) => setFormUnit(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">메모</label>
          <input
            type="text"
            className="w-full rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="선택 사항"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "요금 추가"}
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-foreground-secondary">불러오는 중...</p>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">전체 기본 요금</h2>
            <RateTable
              rates={defaultRates}
              hotelName={hotelName}
              editingId={editingId}
              editPrice={editPrice}
              editUnit={editUnit}
              editNote={editNote}
              setEditPrice={setEditPrice}
              setEditUnit={setEditUnit}
              setEditNote={setEditNote}
              startEdit={startEdit}
              saveEdit={saveEdit}
              cancelEdit={() => setEditingId(null)}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">호텔별 요금 (기본 요금 override)</h2>
            {hotelRates.length === 0 ? (
              <p className="mt-3 text-sm text-foreground-secondary">아직 호텔별 요금이 없어요. 위 폼에서 호텔을 선택해 추가하세요.</p>
            ) : (
              <RateTable
                rates={hotelRates}
                hotelName={hotelName}
                editingId={editingId}
                editPrice={editPrice}
                editUnit={editUnit}
                editNote={editNote}
                setEditPrice={setEditPrice}
                setEditUnit={setEditUnit}
                setEditNote={setEditNote}
                startEdit={startEdit}
                saveEdit={saveEdit}
                cancelEdit={() => setEditingId(null)}
              />
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">청소 담당팀 등록</h2>
            <p className="mt-1 text-xs text-foreground-secondary">
              객실 점검 시 선택 가능한 청소 담당팀 목록이에요 (모바일 앱에 즉시 반영돼요)
            </p>
            <form
              onSubmit={handleCreateTeam}
              className="mt-3 flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-xs font-medium text-foreground-secondary">팀 이름</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="예: D팀"
                />
              </div>
              <button
                type="submit"
                disabled={teamSubmitting}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {teamSubmitting ? "추가 중..." : "팀 추가"}
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {cleaningTeams.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full bg-white px-4 py-2 text-xs font-medium text-foreground-secondary shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function RateTable({
  rates,
  hotelName,
  editingId,
  editPrice,
  editUnit,
  editNote,
  setEditPrice,
  setEditUnit,
  setEditNote,
  startEdit,
  saveEdit,
  cancelEdit,
}: {
  rates: ServiceRate[];
  hotelName: (hotelId: string | null) => string;
  editingId: string | null;
  editPrice: number;
  editUnit: string;
  editNote: string;
  setEditPrice: (v: number) => void;
  setEditUnit: (v: string) => void;
  setEditNote: (v: string) => void;
  startEdit: (rate: ServiceRate) => void;
  saveEdit: (id: string) => void;
  cancelEdit: () => void;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-background-subtle text-xs text-foreground-secondary">
            <th className="px-4 py-3 font-medium">호텔</th>
            <th className="px-4 py-3 font-medium">서비스 유형</th>
            <th className="px-4 py-3 font-medium">요금</th>
            <th className="px-4 py-3 font-medium">단위</th>
            <th className="px-4 py-3 font-medium">메모</th>
            <th className="px-4 py-3 font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => (
            <tr key={r.id} className="border-b border-background-subtle last:border-0">
              <td className="px-4 py-3">{hotelName(r.hotelId)}</td>
              <td className="px-4 py-3">{SERVICE_TYPE_LABEL[r.serviceType]}</td>
              <td className="px-4 py-3">
                {editingId === r.id ? (
                  <input
                    type="number"
                    min={0}
                    className="w-28 rounded-lg border border-background-subtle bg-background-subtle px-2 py-1 text-sm outline-none focus:border-primary"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                  />
                ) : (
                  `${r.price.toLocaleString()}원`
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === r.id ? (
                  <input
                    type="text"
                    className="w-20 rounded-lg border border-background-subtle bg-background-subtle px-2 py-1 text-sm outline-none focus:border-primary"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  />
                ) : (
                  r.unit
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === r.id ? (
                  <input
                    type="text"
                    className="w-40 rounded-lg border border-background-subtle bg-background-subtle px-2 py-1 text-sm outline-none focus:border-primary"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                ) : (
                  r.note ?? "-"
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === r.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(r.id)} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90">
                      저장
                    </button>
                    <button onClick={cancelEdit} className="rounded-lg bg-background-subtle px-3 py-1 text-xs font-medium text-foreground-secondary hover:opacity-80">
                      취소
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(r)} className="rounded-lg bg-background-subtle px-3 py-1 text-xs font-medium text-foreground-secondary hover:opacity-80">
                    수정
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
