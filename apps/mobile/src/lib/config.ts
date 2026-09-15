// 배포 환경별 API 서버 주소 설정.
// - 로컬 개발: .env(EXPO_PUBLIC_API_BASE_URL) 없이 그대로 두면 localhost:3001로 동작.
// - EAS Update로 배포된 빌드: eas.json의 env 또는 `eas update` 실행 전 셸 환경변수로
//   EXPO_PUBLIC_API_BASE_URL을 실제 배포된 백엔드 URL(Railway/Render 등)로 지정해야 함.
//   (EXPO_PUBLIC_ 접두사가 붙은 값만 클라이언트 번들에 인라인됨 — Expo 표준 방식)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
