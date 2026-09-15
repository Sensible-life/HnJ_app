import { API_BASE_URL } from "./config";
// FR: "모니터링 도구 연동 (크래시/에러/알림 발송 실패 로그)" — TODO.md Phase 7.
// 진짜 크래시 리포팅 서비스(Sentry 등)는 계정/DSN 발급이 필요해 이 개발 환경에서는
// 붙이지 못했다. 대신 백엔드에 만들어둔 POST /logs/client-error로 최소한의 에러
// 리포팅을 구현해뒀다 — 실제 서비스에서는 이 함수 내부만 Sentry SDK 호출로 교체하면 된다.

export function reportError(message: string, stack?: string, context?: Record<string, unknown>) {
  // 리포팅 자체가 앱을 죽이면 안 되므로 항상 fire-and-forget + swallow.
  fetch(`${API_BASE_URL}/logs/client-error`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform: "mobile", message, stack, context }),
  }).catch(() => {
    // 오프라인이거나 서버가 꺼져 있으면 리포팅을 포기한다 (재시도 큐는 TODO).
  });
}

// 미처리 JS 예외(동기 렌더 외 콜백 등)와 Promise rejection까지 최대한 넓게 잡는다.
export function installGlobalErrorReporting() {
  const g = globalThis as unknown as {
    ErrorUtils?: { setGlobalHandler: (fn: (error: Error, isFatal?: boolean) => void) => void; getGlobalHandler: () => (error: Error, isFatal?: boolean) => void };
  };

  if (g.ErrorUtils) {
    const previousHandler = g.ErrorUtils.getGlobalHandler();
    g.ErrorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error.message, error.stack, { isFatal: Boolean(isFatal) });
      previousHandler(error, isFatal);
    });
  }

  const onUnhandledRejection = (event: { reason?: unknown }) => {
    const reason = event?.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    reportError(message, stack, { source: "unhandledrejection" });
  };
  // React Native의 Promise 폴리필(promise/setimmediate)은 window 이벤트를 지원한다.
  // 일부 환경에서는 window가 없을 수 있어 안전하게 감싼다.
  try {
    (globalThis as unknown as { addEventListener?: (type: string, cb: (e: unknown) => void) => void }).addEventListener?.(
      "unhandledrejection",
      onUnhandledRejection as (e: unknown) => void,
    );
  } catch {
    // 이 RN 버전/환경에서 unhandledrejection 이벤트를 지원하지 않으면 조용히 넘어간다.
  }
}
