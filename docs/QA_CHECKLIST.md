# QA / 최적화 / 배포 체크리스트 (Phase 7)

`TODO.md` Phase 7의 각 항목에 대해 "이 개발 환경(클라우드 샌드박스, 실기기/실 도메인/외부 계정 없음)에서
코드로 구현·검증까지 끝난 것"과 "실제 사람이 실기기/실 계정/실 인프라로 직접 확인해야 하는 것"을 구분해 정리한다.
후자를 미완료로 남겨두는 것이 아니라 — 애초에 클라우드 개발 컨테이너 안에서는 물리적으로 할 수 없는 종류의
작업이라는 뜻이다.

## 1. 성능 테스트 — 3G/LTE 환경 2초 이내 응답

**구현/검증 완료**
- `apps/api/scripts/perf-smoke.mjs` (`npm run perf:smoke --workspace=apps/api`): 서버가 떠 있는 상태에서
  핵심 엔드포인트(`/hotels`, `/admin/stats/dashboard`, `/schedules`, `/inspections/sync`)를 20회씩 반복 호출해
  p50/p95/max 응답 시간을 측정하고 2초 예산과 비교해 pass/fail을 출력한다.
- 실측 결과(이 환경 기준, 인메모리 스토어 + 로컬 파일 I/O): 전 항목 p95 30ms 미만 — 2초 예산 대비 압도적으로 여유.

**실제 사람이 확인해야 하는 것**
- 이 스크립트는 "서버 처리 시간"만 잰다. 3G/LTE의 실제 왕복 지연(RTT 100~300ms대, 대역폭 제한)까지 포함한
  체감 응답 시간은 Chrome DevTools의 Network Throttling(Slow 3G/Fast 4G 프로파일)이나 실기기의 개발자 옵션
  네트워크 제한 기능으로 별도 측정해야 한다. 클라우드 컨테이너에는 이런 네트워크 스로틀링 기능이 없다.
- 실제 DB(Prisma/PostgreSQL) 연동 후에는 쿼리 성능이 달라지므로 이 벤치마크를 재실행해서 회귀가 없는지 확인할 것.

## 2. 보안 점검 — HTTPS/TLS 1.3, 오프라인 데이터 암호화

**구현/검증 완료**
- `helmet()` 미들웨어 적용 (보안 헤더: HSTS, X-Content-Type-Options 등) — curl로 헤더 응답 확인 완료.
- 전역 `ValidationPipe({ whitelist: true, transform: true })` — DTO에 없는 필드 자동 제거, 타입 강제 변환.
- `GlobalExceptionFilter` — 모든 미처리 예외를 구조화된 JSON으로 로깅 (모니터링 항목과 연동).
- `RateLimitMiddleware` — `/inspections/sync`, `/media/upload`에 분당 60회 제한 (in-memory, IP 기준).
  curl로 65연속 요청 시 61번째부터 429 응답하는 것 확인 완료.
- CORS: `ALLOWED_ORIGIN` 환경변수가 설정되면 해당 origin으로 제한, 없으면(현재 개발 환경) 전체 허용 — 배포 시
  반드시 환경변수를 설정해야 함을 `main.ts` 주석에 명시.

**실제 사람이 확인해야 하는 것**
- **HTTPS/TLS 1.3**: 이 코드가 하는 일이 아니라 배포 인프라의 책임이다. 실제 도메인을 발급받고, 리버스 프록시
  (nginx/Caddy) 또는 로드밸런서(ALB 등)에서 TLS termination을 구성해야 한다. nginx 기준 최소 설정 예시:
  `ssl_protocols TLSv1.3;` + Let's Encrypt(certbot) 인증서 자동 갱신. 클라우드 개발 컨테이너에는 발급 가능한
  실제 도메인이 없어 여기서는 구성할 수 없다.
- **오프라인 데이터 암호화 (모바일 SQLite)**: 현재 `expo-sqlite`는 Expo managed workflow(Expo Go) 기준으로
  파일 자체 암호화(SQLCipher 등)를 기본 지원하지 않는다. 옵션은 두 가지:
  1) dev client로 전환해 `expo-sqlite`를 SQLCipher 지원 포크로 교체 (NFC와 마찬가지로 Expo Go로는 불가능,
     이미 TODO.md에 있는 "NFC dev client 빌드" 작업과 함께 진행하는 게 효율적).
  2) 기기 자체의 파일시스템 암호화(iOS Data Protection, Android FBE)에 의존하고, 앱 레벨에서는 로그인
     토큰류만 `expo-secure-store`(Keychain/Keystore 기반)에 저장 — 지금 로그인이 아직 로컬 상태값이라
     실제 토큰 저장 코드는 없지만, Phase 1의 AuthModule 연동 시 `expo-secure-store`를 쓰도록 미리 결정해둠.
  이 결정(SQLCipher dev client 전환 여부)은 제품 요구사항(민감도) 판단이 필요해 사람이 정해야 한다.

## 3. 실기기 테스트 — iOS 15.1+ / Android 8.0(API 26)+

**구현/검증 완료**
- `app.json`에 `expo-build-properties` 플러그인 추가: `android.minSdkVersion: 26`(Android 8.0),
  `ios.deploymentTarget: "16.4"`.
- ⚠️ **주의**: SRS 목표는 iOS 14였지만, 실제로 `npx expo start`를 돌려보니 Expo SDK 57은 iOS 16.4 미만을
  아예 허용하지 않는다(처음엔 15.1로 넣었다가 `ios.deploymentTarget needs to be at least version 16.4`
  에러로 실기기에서 확인됨 — 문서만으로 짐작하지 않고 실행해서 정확한 하한을 확정했다). iOS 14/15 지원이
  꼭 필요하다면 Expo SDK를 낮추거나(구형 RN 아키텍처), iOS 16.4+ 로 타깃을 올리는 두 선택지 중 사람이
  결정해야 한다 — SRS 재검토 필요.

**실제 사람이 확인해야 하는 것 (물리 기기 필요)**
아래는 실기기에서 수동으로 체크해야 하는 항목 — 이 클라우드 컨테이너에는 iOS/Android 실기기도, macOS의
Xcode 시뮬레이터도 없어 직접 실행/캡처가 불가능하다.

- [ ] iOS 15.1 실기기(또는 그 이상)에서 Expo Go로 QR 체크인 → ROOM PRO 점검 → BATH PRO 연동 → 완료까지 전체 플로우
- [ ] Android 8.0(API 26) 실기기에서 동일 플로우 — 특히 이번에 고친 안전영역(상단바/하단바) 처리가 제스처 내비게이션
      기기와 3버튼 내비게이션 기기 양쪽에서 잘 보이는지
- [ ] 저사양 기기에서 카메라 연속 촬영 시 메모리/버벅임
- [ ] 오프라인 상태에서 점검 완료 → 기기를 온라인으로 전환 → 자동 동기화되는지 (FR-INSP-05)
- [ ] 다양한 화면 크기(SE 계열 소형 ~ Pro Max/태블릿)에서 반응형 레이아웃 확인

## 4. E2E 시나리오 자동화 — 체크인→점검→리포트→승인

**구현/검증 완료**
- `apps/api/test/inspection-flow.e2e-spec.ts` (`npm run test:e2e --workspace=apps/api`): 8개 테스트, 전부 통과.
  체크인 자체는 모바일 로컬(SQLite) 단계라 서버에서 직접 검증할 수 없지만, 그 이후 전 구간
  (동기화 → 리포트 생성/저장 → 알림톡 mock 발송 → 승인 티켓 발급 → 1-Click 승인 웹뷰 조회/승인 →
  통계 대시보드 반영)을 실제 HTTP 요청으로 검증한다.
- 모바일 쪽(체크인 → 로컬 SQLite 저장 → 화면 전환)은 React Native 컴포넌트 테스트가 필요한데, 이 프로젝트에는
  아직 모바일 테스트 러너(Jest/RNTL)가 설정돼 있지 않다 — Phase 7 후속 작업으로 남겨둠.

## 5. 앱스토어 / 플레이스토어 등록 및 심사 대응

이 항목은 코드 작업이 아니라 계정 가입·서류 준비·실제 제출이 필요해 이 세션에서 완료할 수 없다. 준비 체크리스트만
남겨둔다.

- [ ] Apple Developer Program 가입 (연$99) + App Store Connect 앱 등록
- [ ] Google Play Console 가입 (1회 $25) + 앱 등록
- [ ] 앱 아이콘/스크린샷 세트 준비 (iOS: 여러 기기 크기별, Android: 폰/태블릿)
- [ ] 개인정보처리방침(Privacy Policy) URL — 카메라/위치 권한을 쓰므로 필수
- [ ] 카메라 권한(`NSCameraUsageDescription` 등은 이미 app.json에 있음) 및 위치 권한 사용 목적을 심사 노트에 명시
- [ ] Android "데이터 보안(Data Safety)" 설문 작성 — 어떤 데이터를 수집/전송하는지(사진, GPS, 사용자 정보)
- [ ] 연령 등급 설문
- [ ] EAS Build(`eas build`)로 프로덕션 바이너리 빌드 — 이 환경에는 Apple/Google 계정 자격 증명이 없어 실행 불가

## 6. 모니터링 도구 연동 — 크래시/에러/알림 발송 실패 로그

**구현/검증 완료**
- 서버: `GlobalExceptionFilter`가 모든 미처리 예외를 구조화 로그로 남김. `NotificationLogStore` +
  `GET /admin/notifications/log?failedOnly=true`로 알림톡/Push 발송 성공·실패 이력 조회 가능
  (`NotificationsService`가 발송 시도마다 기록, 실패 시 에러 메시지도 함께 저장).
- 서버: `ClientErrorStore` + `POST /logs/client-error` + `GET /admin/logs/client-errors` — 모바일/관리자 웹의
  크래시·미처리 예외를 수집하는 엔드포인트.
- 모바일: `ErrorBoundary`(렌더링 예외) + `installGlobalErrorReporting()`(전역 JS 예외, Promise rejection)이
  발생 즉시 `POST /logs/client-error`로 리포팅. curl로 직접 리포팅 엔드포인트 동작 확인 완료.

**실제 사람이 확인해야 하는 것**
- 지금은 모두 인메모리 저장소라 서버 재시작 시 로그가 사라진다. 실제 운영에서는 DB 또는 외부 로그 수집기로
  옮겨야 한다.
- 진짜 실시간 알림(Slack/PagerDuty 등)을 받으려면 Sentry/Datadog 같은 외부 APM 서비스 가입 + DSN 발급이
  필요하다. `GlobalExceptionFilter`와 `errorReporting.ts`에 "여기에 Sentry.captureException() 등을 연결"
  이라는 TODO 주석을 남겨뒀으니, 계정이 생기면 그 지점만 교체하면 된다.
