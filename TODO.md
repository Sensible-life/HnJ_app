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
- [ ] 촬영 시 자동 워터마크 각인 (호텔명/객실번호/일시)
- [ ] 사진 업로드 백그라운드 비동기 처리
- [ ] 미디어 스토리지(S3 호환) 연동

## Phase 4 — 리포트/알림
- [ ] 점검 완료 시 웹 리포트 URL 자동 생성
- [ ] PDF 리포트 자동 생성 (Puppeteer)
- [ ] 카카오 알림톡 발송 연동 (긴급 건 발생 시)
- [ ] 웹뷰 1-Click 승인/재점검 요청 페이지 (비로그인 접근)
- [ ] FCM Push 발송 연동

## Phase 5 — BATH PRO 연동 + 이슈트래커
- [ ] ROOM PRO '화장실' 항목 주의/긴급 선택 시 BATH PRO Bottom Sheet 연동
- [ ] BATH PRO 12개 구역 점검 UI (작업 전/중/후 사진, 수리/비용/재방문일 입력)
- [ ] 이슈 상태 추적(진행중/완료/미완료) 화면

## Phase 6 — 관리자 웹 고도화
- [ ] 일정 관리 (호텔별 정기 방문 주기 자동 생성, 담당자 배정, 미방문 알림)
- [ ] 사용자/권한 관리 화면
- [ ] 통계 대시보드 (일일/월간, 청소 불량률, 문제 유형별 분석 그래프)
- [ ] 객실 타임라인 피드 + Before/After 스플릿 슬라이더
- [ ] Quick-Draw 마킹 도구 (사진 위 화살표/원 오버레이)

## Phase 7 — QA/최적화/배포
- [ ] 성능 테스트: 3G/LTE 환경 2초 이내 응답 확인
- [ ] 보안 점검: HTTPS/TLS 1.3, 오프라인 데이터 암호화 확인
- [ ] 실기기 테스트 (iOS 14 / Android 8.0 최소 버전)
- [ ] E2E 시나리오 자동화 (체크인→점검→리포트→승인)
- [ ] 앱스토어/플레이스토어 등록 및 심사 대응
- [ ] 모니터링 도구 연동 (크래시/에러/알림 발송 실패 로그)

## 상시 항목
- [ ] 요구사항 변경 시 SRS 및 이 문서 동기화
- [ ] 매 Phase 종료 시 `BUILD_PLAN.md` DoD 기준 검토
