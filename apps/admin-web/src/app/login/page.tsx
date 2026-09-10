export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-[20px] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h1 className="text-2xl font-bold text-foreground">BATH PRO / ROOM PRO</h1>
        <p className="mt-1 text-sm text-foreground-secondary">관리자 로그인</p>

        <form className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">이메일</label>
            <input
              type="email"
              className="w-full rounded-xl border border-background-subtle bg-background-subtle px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">비밀번호</label>
            <input
              type="password"
              className="w-full rounded-xl border border-background-subtle bg-background-subtle px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-full bg-nav-active-bg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}
