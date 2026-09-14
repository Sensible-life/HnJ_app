"use client";

import { useEffect, useState, useCallback } from "react";
import { api, AdminUser, Hotel, Role } from "../../../lib/api";

const ROLE_LABEL: Record<Role, string> = {
  INSPECTOR: "현장 점검자",
  HOTEL_MANAGER: "호텔 담당자",
  HQ_ADMIN: "본사 관리자",
};

const ROLE_TONE: Record<Role, string> = {
  INSPECTOR: "bg-primary-soft text-primary",
  HOTEL_MANAGER: "bg-status-success-bg text-status-success",
  HQ_ADMIN: "bg-status-urgent-bg text-status-urgent",
};

// FR: 사용자/권한 관리 화면 — TODO.md Phase 6
export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("INSPECTOR");
  const [hotelIds, setHotelIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, h] = await Promise.all([api.getUsers(), api.getHotels()]);
      setUsers(u);
      setHotels(h);
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

  function toggleHotel(id: string) {
    setHotelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitting(true);
    try {
      await api.createUser({ name, email, phone: phone || undefined, role, hotelIds });
      setName("");
      setEmail("");
      setPhone("");
      setRole("INSPECTOR");
      setHotelIds([]);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground">사용자/권한 관리</h1>
      <p className="mt-1 text-sm text-foreground-secondary">현장 점검자, 호텔 담당자, 본사 관리자 계정을 관리하세요</p>

      {error && <p className="mt-4 rounded-xl bg-status-urgent-bg px-4 py-3 text-sm text-status-urgent">{error}</p>}

      <form onSubmit={handleCreate} className="mt-8 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">사용자 추가</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="user@hnjapp.local"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">연락처</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">권한(Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">담당 호텔 (복수 선택)</label>
          <div className="flex flex-wrap gap-2">
            {hotels.map((h) => (
              <button
                type="button"
                key={h.id}
                onClick={() => toggleHotel(h.id)}
                className={
                  hotelIds.includes(h.id)
                    ? "rounded-full bg-nav-active-bg px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full bg-background-subtle px-3 py-1.5 text-xs font-medium text-foreground-secondary"
                }
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-full bg-nav-active-bg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "추가 중..." : "사용자 추가"}
        </button>
      </form>

      <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">전체 사용자</h2>
        {loading ? (
          <p className="mt-4 text-sm text-foreground-secondary">불러오는 중...</p>
        ) : (
          <div className="mt-4 divide-y divide-background-subtle">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-foreground-secondary">
                    {u.email} {u.phone ? `· ${u.phone}` : ""} · 담당 호텔{" "}
                    {u.hotelIds.map((id) => hotels.find((h) => h.id === id)?.name ?? id).join(", ") || "-"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_TONE[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
