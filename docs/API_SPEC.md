# API 명세서 (초안) — BATH PRO / ROOM PRO

> 상태: **Draft** — 개발 진행하며 계속 수정 예정. 확정본 아님.
> Base URL: `https://api.hnj-app.example.com/v1` (예시)
> 인증: `Authorization: Bearer <JWT>` (자동로그인은 refresh token 별도 쿠키/시큐어스토리지)
> 공통 응답 형식: `{ "success": boolean, "data": any, "error": { "code": string, "message": string } | null }`

## 0. 공통 규칙

- 역할(role)별 접근 제어는 모든 엔드포인트에 미들웨어로 적용 (`현장점검자` / `호텔담당자` / `본사관리자`)
- 오프라인 동기화 엔드포인트는 클라이언트 로컬 생성 시각과 서버 시각이 다를 수 있으므로 idempotency key(클라이언트 생성 UUID) 필수
- 페이지네이션: `?page=1&limit=20` (목록 조회 공통)

## 1. Auth (FR-AUTH-01/02)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/auth/login` | 이메일/비밀번호 로그인, JWT+refresh 발급 | 전체 |
| POST | `/auth/refresh` | refresh token으로 세션 자동 복구 | 전체 |
| POST | `/auth/logout` | 로그아웃, refresh token 폐기 | 전체 |
| GET | `/auth/me` | 현재 로그인 사용자 정보 + role | 전체 |

## 2. Hotel / Room (체크인 기반 데이터)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/hotels` | 담당 호텔 목록 조회 | 호텔담당자, 본사관리자 |
| GET | `/hotels/:hotelId/rooms` | 호텔 내 객실 목록 | 전체 |
| GET | `/rooms/lookup?qrTagId=` | QR 태그 ID로 객실 조회 (퀵체크인용) | 현장점검자 |
| GET | `/rooms/lookup?nfcTagId=` | NFC 태그 ID로 객실 조회 (퀵체크인용) | 현장점검자 |

## 3. Inspection Session / Item (FR-INSP-01~05)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/inspections/sessions` | 체크인 완료 시 세션 생성 (roomId, type, checkinMethod, gps) | 현장점검자 |
| GET | `/inspections/sessions/:id` | 세션 상세 (항목 목록 포함) | 관련자 |
| PATCH | `/inspections/sessions/:id/items/:itemId` | 3-State 값/코멘트 업데이트 | 현장점검자 |
| POST | `/inspections/sessions/:id/link-bath-pro` | ROOM PRO에서 BATH PRO 세션 연동 생성 (FR-INSP-04) | 현장점검자 |
| POST | `/inspections/sessions/:id/complete` | 점검 완료 처리 → 리포트 생성 트리거 | 현장점검자 |
| POST | `/inspections/sync` | 오프라인 배치 동기화 (idempotency key 배열) | 현장점검자 |

## 4. Media (FR-MED-01~03)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/media/upload` | 사진 업로드 (multipart), 서버에서 워터마크 각인 | 현장점검자 |
| PATCH | `/media/:id/marking` | Quick-Draw 오버레이 좌표 저장 | 현장점검자 |
| GET | `/media/compare?itemId=` | Before/After 쌍 조회 (스플릿 슬라이더용) | 전체 |

## 5. Report (FR-REP-01/03)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/reports/:sessionId` | 웹 리포트 데이터 조회 | 관련자 |
| GET | `/reports/:sessionId/pdf` | PDF 다운로드 URL | 관련자 |
| GET | `/rooms/:roomId/timeline` | 객실별 점검/수리 이력 타임라인 (FR-REP-03) | 전체 |

## 6. Issue Ticket / Approval (FR-REP-02)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/tickets` | 이슈 티켓 목록 (상태 필터) | 전체 |
| GET | `/tickets/:id` | 티켓 상세 | 전체 |
| POST | `/tickets/:id/approve` | 1-Click 조치 승인 (알림톡 웹뷰 토큰 인증, 비로그인 접근) | 호텔담당자 |
| POST | `/tickets/:id/reinspect` | 재점검 요청 | 호텔담당자 |
| PATCH | `/tickets/:id` | 수리 자재/비용/재방문일 입력 | 현장점검자 |

## 7. Notification

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/notifications/alimtalk` | (내부용) 알림톡 발송 트리거 | 시스템 |
| POST | `/notifications/push` | (내부용) FCM Push 발송 트리거 | 시스템 |
| GET | `/notifications` | 알림 수신 이력 | 전체 |

## 8. Schedule / Admin (5장 관리/설정)

| Method | Endpoint | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/schedules` | 호텔별 정기 방문 일정 조회 | 본사관리자 |
| POST | `/schedules` | 일정 생성/자동 생성 규칙 등록 | 본사관리자 |
| PATCH | `/schedules/:id` | 담당자 재배정 | 본사관리자 |
| GET | `/admin/users` | 사용자 목록 | 본사관리자 |
| POST | `/admin/users` | 사용자 생성 + role/호텔 매핑 | 본사관리자 |
| GET | `/admin/stats/dashboard` | 일일/월간 통계, 불량률, 문제 유형별 분석 | 호텔담당자, 본사관리자 |

## 확정이 필요한 부분 (TODO)

- [ ] REST vs GraphQL 최종 결정 (현재 REST 기준 초안)
- [ ] 알림톡 1-Click 승인 웹뷰의 인증 방식 (토큰 만료 시간, 1회성 여부)
- [ ] 오프라인 동기화 배치 API의 충돌 응답 스펙 (어떤 필드가 충돌했는지 클라이언트에 어떻게 알려줄지)
- [ ] 파일 업로드 용량 제한 및 압축 정책
- [ ] 페이지네이션/필터링 공통 스펙을 OpenAPI(Swagger)로 문서화할지 여부
