# TODO — BATH PRO / ROOM PRO

`BUILD_PLAN.md`의 Phase 구성을 실행 단위로 쪼갠 체크리스트. 완료 항목은 `[x]`로 표시.

## Phase 0 — 기획/설계
- [ ] SRS v2.0 팀 리뷰 및 확정 (변경사항 있으면 v2.1로 버전업)
- [x] ERD 초안 작성 (`docs/ERD.md`) — 세부 확정 항목은 문서 내 TODO 참고
- [x] API 명세서 초안 작성 (`docs/API_SPEC.md`)
- [x] Figma 디자인 톤앤매너 참고본 확보, `docs/DESIGN_TOKENS.md`로 컬러/타이포/컴포넌트 패턴 정리
- [x] 기술 스택 확정: React Native(Expo) + Next.js + NestJS + PostgreSQL/Prisma
- [ ] 카카오 알림톡 비즈니스 계정/템플릿 사전 신청 (심사 기간 고려해 최대한 빨리)

## Phase 1 — 기반 셋업
- [x] 모노레포 구조 초기화 (npm workspaces: apps/mobile, apps/admin-web, apps/api, packages/shared-types)
- [x] React Native 프로젝트 생성 (Expo, TypeScript) — NFC/카메라 권한 설정은 미완료
- [x] Next.js 관리자 웹 프로젝트 생성 (Tailwind, 디자인 토큰 적용, 로그인/대시보드 페이지 스켈레톤)
- [x] NestJS API 서버 초기화 + Prisma 스키마 작성 (`apps/api/prisma/schema.prisma`)
  - ⚠️ `npx prisma generate`가 이 기기 네트워크 정책상 Prisma 엔진 바이너리(`binaries.prisma.sh`)를 못 받아옴 — 일반 네트워크 환경에서 한 번 실행 필요
- [x] RBAC 인증/JWT 발급 모듈 스켈레톤 구현 (login/refresh/me, RolesGuard) — DB 미연결 상태라 실제 로그인 미검증
- [x] 모바일 앱 테마(`src/theme/tokens.ts`) + React Navigation(Bottom Tabs) + 로그인/홈 화면 스켈레톤
- [ ] 자동 로그인(세션 복구) 실제 구현 (refresh token 저장/재발급 연동)
- [ ] CI/CD 파이프라인 (GitHub Actions: lint/test/build)
- [ ] 스테이징 환경 배포 (API + 관리자 웹)

## Phase 2 — 핵심 점검 플로우 (MVP 핵심)
- [x] QR 스캔 체크인 (expo-camera, `CheckInScreen`) — 실제 서버 룸 조회(`/rooms/lookup`) 연동은 아직, 스캔값을 그대로 객실명으로 사용 중
- [ ] NFC 태깅 체크인 — UI 버튼/안내까지만 구현, 실제 NFC 하드웨어 연동은 Expo Go에서 불가하여 dev client 빌드 필요
- [x] GPS 보조 검증 로직 (expo-location으로 체크인 시 위/경도 기록)
- [x] ROOM PRO 15개 구역 3-State 토글 UI (`RoomInspectionScreen`, `ThreeStateToggle`)
- [x] 긴급 선택 시 카메라 자동 호출/강제 (최소 1장, expo-image-picker)
- [x] 로컬 SQLite 임시 저장 + 동기화 큐 (`lib/db.ts`, `lib/sync.ts`)
- [x] 네트워크 재연결 시 자동 동기화 기초 구현 (`syncPendingSessions`) — 충돌 처리 정책은 아직 미구현


## Phase 3 — 미디어 엔진
- [x] 촬영 시 자동 워터마크 각인 — 서버(sharp)에서 합성 (`apps/api/src/media`), 실제 워터마크 이미지로 확인 완료
- [x] 사진 업로드 백그라운드 비동기 처리 — 로컬 SQLite `media` 테이블에 큐잉 후 온라인 시 자동 업로드 (`lib/mediaSync.ts`)
- [ ] 미디어 스토리지(S3 호환) 연동 — 현재는 API 서버 로컬 디스크(`apps/api/uploads/`)에 저장 중, 배포 전 S3/R2로 교체 필요
- [x] Quick-Draw 마킹 도구 (화살표/원 오버레이) — Phase 6에서 구현 완료 (`/rooms`의 QuickDrawCanvas)
- [x] Before/After 비교 뷰어 — Phase 6에서 구현 완료 (`/rooms`의 BeforeAfterSlider)


## Phase 4 — 리포트/알림
- [x] 점검 완료 시 웹 리포트 URL 자동 생성 (`POST /inspections/sync` → `/uploads/reports/<id>.html`)
- [x] PDF 리포트 자동 생성 — Puppeteer 대신 pdfkit 사용 (이 환경 네트워크 정책상 Chromium 다운로드 불가, `report-pdf.util.ts`), 실제 PDF 확인 완료
- [x] 카카오 알림톡 발송 연동 — 실제 API 키가 없어 콘솔 로그 MOCK으로 구현 (`notifications.service.ts`), 실 연동 시 이 파일만 교체하면 됨
- [x] 웹뷰 1-Click 승인/재점검 요청 페이지 (비로그인 접근) — `GET/POST /approve/:token` (`tickets` 모듈)
- [x] FCM Push 발송 연동 — 알림톡과 동일하게 MOCK 구현, Firebase Admin SDK 키 확보 후 교체 필요
- [ ] 위 흐름을 실제 DB(Prisma)와 연결 — 현재는 인메모리 저장소(`TicketsStore`)로 임시 구현, Prisma Client 생성이 되는 환경에서 리포지토리로 교체 필요

## Phase 5 — BATH PRO 연동 + 이슈트래커
- [x] ROOM PRO '화장실' 항목(room-03) 주의/긴급 선택 시 BATH PRO Bottom Sheet 연동 (`BathProSheet`, `RoomInspectionScreen`)
- [x] BATH PRO 12개 구역 점검 UI — 3-State 토글 + 작업 전/중/후 사진(BEFORE/GENERAL/AFTER) + 수리자재/비용/재방문일 입력 (`BathProInspectionScreen`)
  - BATH PRO 세션은 ROOM PRO 세션의 자식 세션으로 로컬 저장 (`sessions.parent_session_id`), 완료 시 동일하게 `/inspections/sync`로 동기화
- [x] 이슈 상태 추적(진행중/완료/미완료) 화면 (`IssueTrackerScreen`, 모바일 "이슈" 탭) — 현재는 로컬 SQLite의 주의/긴급 항목을 기준으로 상태를 근사 표시, 실제 DB 연동 후 IssueTicket.status 기준으로 교체 필요

## Phase 6 — 관리자 웹 고도화
- [x] 일정 관리 — `/schedule`: 호텔/담당자/월 방문횟수로 일정 자동 생성(다음 방문일 자동 계산), 담당자 재배정, 미방문(overdue) 알림 배지. 백엔드 `SchedulesStore`(인메모리) + `GET/POST/PATCH /schedules`
- [x] 사용자/권한 관리 화면 — `/users`: 목록 + role 배지 + 생성 폼(담당 호텔 다중 선택). 백엔드 `UsersStore` + `GET/POST/PATCH /admin/users`
- [x] 통계 대시보드 — `/` 재작성: 오늘/월간 점검 수, 긴급 미조치, 청소 불량률 스탯카드 + 최근 7일 추이 막대그래프 + 문제 유형별 도넛차트 + 호텔별 요약 (차트는 외부 라이브러리 없이 순수 SVG). 백엔드 `GET /admin/stats/dashboard` (`StatsController`, `InspectionsStore` 집계)
- [x] 객실 타임라인 피드 + Before/After 스플릿 슬라이더 — `/rooms`: 객실 선택 → 점검 이력 타임라인(항목 상태 배지, 리포트 링크) + clip-path 기반 비교 슬라이더. 백엔드 `InspectionsStore`(`/inspections`, `/inspections/room`) + `MediaStore`(`/media?hotelName&roomLabel`, 모바일 `mediaSync.ts`가 sessionId/itemId/mediaType 함께 전송하도록 확장)
- [x] Quick-Draw 마킹 도구 (사진 위 화살표/원 오버레이) — `/rooms`의 `QuickDrawCanvas`: 캔버스 2장(이미지+드로잉)으로 화살표/원 마킹, 실행취소/전체지우기 지원 (현재는 세션 내 캔버스 상태만 — 마킹 결과 서버 저장은 TODO)

## Phase 7 — QA/최적화/배포
> 세부 근거/실측 결과/실제 사람이 해야 할 일은 `docs/QA_CHECKLIST.md` 참고.
- [x] 성능 테스트 — `apps/api/scripts/perf-smoke.mjs`(`npm run perf:smoke`)로 핵심 엔드포인트 p50/p95 측정,
      전부 2초 예산 대비 압도적 여유(p95 30ms 미만). 실제 3G/LTE RTT까지 포함한 측정은 실기기/DevTools 스로틀링 필요(미완료, 사람 필요)
- [x] 보안 점검 — helmet 보안 헤더, 전역 ValidationPipe, GlobalExceptionFilter, IP 기준 레이트리밋(분당 60회,
      429 확인됨), CORS ALLOWED_ORIGIN 환경변수화. HTTPS/TLS 1.3은 배포 인프라 영역이라 이 환경에서 구성 불가(미완료,
      사람 필요). 오프라인 SQLite 암호화는 Expo Go 제약으로 미구현 — dev client 전환 여부 결정 필요(미완료, 사람 필요)
- [x] 실기기 테스트 — `app.json`에 `expo-build-properties`로 Android minSdkVersion=26(8.0), iOS
      deploymentTarget=16.4 설정(처음 15.1로 넣었다가 `expo start` 실행 시 에러로 실제 하한이 16.4임을 확인해
      수정 — iOS 14/15는 Expo SDK 57 자체가 미지원, 정책 재확인 필요). 실제 기기 실행/캡처는
      물리 기기가 있어야 해서 이 환경에서 불가(미완료, 사람 필요) — 체크리스트는 QA_CHECKLIST.md에 정리
- [x] E2E 시나리오 자동화 — `apps/api/test/inspection-flow.e2e-spec.ts` (`npm run test:e2e`), 8개 테스트 통과:
      동기화→리포트 생성/저장→알림톡 mock 발송→승인 티켓→1-Click 승인 웹뷰→통계 반영까지 전 구간 검증
- [ ] 앱스토어/플레이스토어 등록 및 심사 대응 — 계정 가입/서류/실제 제출이 필요해 이 세션에서 수행 불가. 준비
      체크리스트만 QA_CHECKLIST.md에 정리해둠(미완료, 사람 필요)
- [x] 모니터링 도구 연동 — 서버: GlobalExceptionFilter(예외 구조화 로깅), NotificationLogStore(`GET
      /admin/notifications/log`, 알림 발송 성공/실패 기록), ClientErrorStore(`POST /logs/client-error`, `GET
      /admin/logs/client-errors`). 모바일: ErrorBoundary + 전역 JS 예외/Promise rejection 리포팅. 전부 curl로
      동작 확인 완료. 실서비스 연동(Sentry 등)은 계정/DSN 필요(미완료, 사람 필요)

## UI/반응형
- [x] 모바일 앱 고정 px 대신 화면 비율 기반 스케일 유틸(`src/theme/responsive.ts`: wp/hp/scale/moderateScale) 도입, 모든 화면/컴포넌트에 적용

## 상시 항목
- [ ] 요구사항 변경 시 SRS 및 이 문서 동기화
- [ ] 매 Phase 종료 시 `BUILD_PLAN.md` DoD 기준 검토

## PDF 메뉴 리스트 반영 스코프
> 상세 기능 매핑은 `docs/FEATURE_SCOPE.md` 참고. 아래 항목은 PDF 원안에는 있었지만 기존 MVP/TODO에서 약하거나 빠져 있던 기능이다.

### 우선순위 A — 점검/리포트 품질에 바로 영향 (구현 완료)
- [x] 점검 상태에 `해당 없음`(NOT_APPLICABLE) 추가 — `ThreeStateToggle`이 4-state로 확장(정상/주의/긴급/해당없음), Prisma `ItemState` enum·리포트 HTML/PDF 라벨·색상 매핑까지 반영
- [x] 서비스 구분 추가: 최초 리뉴얼 / 정기점검 / 긴급출동 / 재점검 — `CheckInScreen`에 선택 UI, 로컬 SQLite `sessions.service_type`, Prisma `ServiceType` enum, 리포트 헤더에 라벨 표시
- [x] 항목별 문제 내용 입력 — `RoomInspectionScreen`/`BathProInspectionScreen`의 주의/긴급 항목에 입력 필드, `inspection_items.problem_description`, 리포트/승인페이지에 노출
- [x] 항목별 현장 조치 내용 입력 — 위와 동일 경로로 `action_description` 추가
- [x] 담당자 의견 입력 — 세션 단위(점검 완료 전 총평 텍스트)로 구현: `sessions.inspector_opinion`, Prisma `InspectionSession.inspectorOpinion`, 리포트 헤더 하이라이트 박스, 관리자 웹 객실 타임라인에 표시
- [x] 호텔 승인 필요 여부 입력 — 항목별 토글(`requires_hotel_approval`), `POST /inspections/sync`가 URGENT 또는 이 플래그가 true인 항목에 대해 승인 티켓 생성하도록 게이팅 로직 확장
- [x] 호텔 담당자 의견/답변 입력 — 1-Click 승인/재점검 웹뷰(`approval-page.util.ts`)에 코멘트 textarea 추가, `PATCH` 대신 `POST .../approve|reinspect`가 `comment`를 받아 `TicketRecord.comment`에 저장, 처리 완료 화면에 재노출
- [x] 실제 호텔 선택/담당자 선택 흐름 정리 — `CheckInScreen`이 하드코딩된 `HOTEL_NAME` 대신 `GET /hotels`/`GET /admin/users`(INSPECTOR 필터)로 실제 목록을 불러와 선택하도록 교체 (오프라인/서버 미기동 시에도 체크인 자체는 진행 가능하도록 폴백 유지)

검증: `apps/api` `npm run build`/`npm run test:e2e`(8/8 통과)/실제 서버 기동 후 curl로 sync→승인 티켓 생성→코멘트와 함께 승인→리포트/승인페이지 렌더링 전체 플로우 확인, `apps/mobile` `npx tsc --noEmit` 클린, `apps/admin-web` `npm run build`/`npx eslint src` 클린.

### 우선순위 B — 운영/관리 고도화 (구현 완료)
- [x] 객실 유형 기록 — 체크인 시 선택한 값을 승계, `RoomInspectionScreen`에 객실 유형 칩 선택 UI, SQLite `sessions.room_type`, Prisma `InspectionSession.roomType`, 리포트 HTML/PDF 헤더에 표시
- [x] 청소 담당팀 기록 — 신규 `CleaningTeamsStore`/`GET,POST /cleaning-teams`(A/B/C팀 시드), 모바일에서 팀 목록 조회 후 칩 선택, SQLite `sessions.cleaning_team`, 리포트 반영, 관리자 웹 청소팀별 인스펙션 점수 통계와 연결
- [x] 청소 완료시간 기록 — 청소 완료 토글 시 타임스탬프 저장(`sessions.cleaning_completed_at`), 리포트 HTML/PDF에 청소팀/완료시간 블록 표시
- [x] 분실물 발견 여부 및 보관 장소 기록 — `sessions.lost_item_found`(boolean)/`lost_item_location`, 리포트에 🎒 강조 박스로 표시, sync 시 SQLite 0/1 → boolean 변환 처리
- [x] 담당자별 점검 실적 — `GET /admin/stats/dashboard`의 `byInspector`(세션 수/불량 수/긴급 수/불량률), 관리자 웹 대시보드 "담당자별 점검 실적" 섹션
- [x] 호텔별 문제 발생 순위 — `byHotel`을 불량률 기준 내림차순 정렬 + `rank` 부여, 대시보드 "호텔별 문제 발생 순위" 랭크 배지
- [x] 객실별 문제 발생 횟수 — `byRoom`(호텔+객실 그룹, 불량 건수 내림차순), 대시보드 표시
- [x] 반복 문제 객실/재발 횟수 — `recurringIssues`(호텔+객실+항목명 그룹, count≥2), 대시보드 "반복 문제 객실" 섹션
- [x] 전월 대비 개선율 — `improvementRatePercent`(이번 달 vs 지난 달 불량률 비교, 데이터 부족 시 null), 대시보드 StatCard
- [x] 화장실 상태 변화 그래프 — `bathProTrend`(BATH PRO 세션 14일 일별 정상/주의/긴급 집계), 신규 순수 SVG `StackedBarChart` 컴포넌트로 시각화
- [x] 청소팀별 인스펙션 점수 — `byCleaningTeam`(UNSET/NOT_APPLICABLE 제외 정상 비율 점수화), 대시보드 표시
- [x] 날짜별 사진 비교 — 관리자 웹 객실 타임라인에 임의의 두 시점 사진을 선택하는 select 2개 추가, `BeforeAfterSlider` 재사용(동영상 선택 시 안내 문구로 대체)
- [x] 긴급출동/재점검 일정 타입 — `Schedule.scheduleType`(REGULAR/EMERGENCY/REINSPECTION/INITIAL_RENEWAL), EMERGENCY/REINSPECTION은 1일 간격으로 생성, 일정 관리 페이지에 유형 선택/배지 표시
- [x] 호텔 담당자와 일정 공유 — `POST /schedules/:id/share-link`(토큰 발급) + `GET /schedules/shared/:token`(공개 조회), 일정 관리 페이지 "🔗 호텔과 공유" 버튼으로 링크 클립보드 복사

검증: `apps/api` `npm run build`/`npx vitest run --config vitest.config.e2e.ts`(8/8 통과)/실제 서버 기동 후 curl로 cleaning-teams·schedule 공유·stats dashboard 전체 필드 확인, `apps/mobile` `npx tsc --noEmit` 클린, `apps/admin-web` `npm run build`/`npx eslint src` 클린.

### 우선순위 C — 비용/인프라 영향 큰 후순위 (구현 완료)
- [x] 짧은 동영상 등록 — BATH PRO 화면에 "🎥 동영상" 버튼(`launchCameraAsync`, 최대 15초), `Media.mediaKind = IMAGE/VIDEO`, 백엔드는 video mimetype일 경우 sharp 워터마크 합성을 건너뛰고 원본 바이트 저장, 업로드 파이프라인(`mediaSync.ts`)의 mimetype/확장자 하드코딩 버그도 함께 수정
- [x] SMS 문자 알림 — `NotificationsService.sendSms()`(Mock, `sendAlimtalk`와 동일 패턴) 추가, URGENT 항목 발생 시 알림톡과 SMS를 함께 발송하고 `NotificationLogStore`에 채널 구분 기록
- [x] PDF 공유 UX — `GET /inspections/:id/share`가 PDF/웹 절대 URL과 공유 텍스트를 반환, 관리자 웹 객실 타임라인에 "📄 PDF 공유" 버튼으로 클립보드 복사
- [x] 요금 관리 — Prisma `ServiceRate` 모델(호텔별 override 지원), `RatesStore`(서비스 유형별 기본 요금 4종 시드) + `admin/rates` CRUD API, 관리자 웹 신규 `/rates` 페이지(기본 요금/호텔별 요금 관리 + 청소 담당팀 등록 폼), 사이드바/모바일 내비게이션에 진입점 추가

검증: `apps/api` `npm run build`/`npx vitest run --config vitest.config.e2e.ts`(8/8 통과)/실제 서버 기동 후 curl로 동영상 업로드(`mediaKind: "VIDEO"`)·SMS+알림톡 동시 발송·rates CRUD 확인, `apps/mobile` `npx tsc --noEmit` 클린, `apps/admin-web` `npm run build`/`npx eslint src` 클린.
