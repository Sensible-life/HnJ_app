# BATH PRO / ROOM PRO

호텔 현장의 **화장실 케어(BATH PRO)** 및 **객실 인스펙션(ROOM PRO)** 업무를 디지털화하는 B2B SaaS 플랫폼.
현장 점검자, 호텔 담당자, 본사 관리자가 실시간으로 점검 결과를 공유하고 조치를 승인하는 모바일 앱 + 백오피스 웹 시스템.

> 요구사항 원문: `[SRS] BATH PRO 및 ROOM PRO 앱 개발 요구사항 정의서 v2.0.md`
> 상세 빌드 계획: [`BUILD_PLAN.md`](./BUILD_PLAN.md)
> 작업 목록: [`TODO.md`](./TODO.md)

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 대상 사용자 | 현장점검자 / 호텔 담당자 / 본사 관리자 (RBAC 3-Role) |
| 플랫폼 | 모바일 앱 (iOS 14+, Android 8.0+) + 백오피스 웹 |
| 핵심 가치 | 최소 터치(Minimum Tap), 한 손 사용성, 오프라인 대응, 1-Click 승인 |
| 문서 버전 | v2.0 (2026-09-10, UX/UI & IA 개편 반영) |

## 시스템 구성

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile App      │     │  Backend API     │     │  Admin Web       │
│  (현장점검자)     │────▶│  (Auth/Inspection │◀───│  (호텔담당자/    │
│  React Native    │     │   /Report/Notify) │     │   본사관리자)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              PostgreSQL     Object Storage   카카오 알림톡
              (Prisma ORM)   (이미지/PDF)      / FCM Push
```

## 제안 기술 스택 (확정 전, `BUILD_PLAN.md` 3장 참고)

- **모바일**: React Native (Expo Bare / dev client) — QR·NFC·카메라·오프라인 저장 필요
- **백오피스 웹**: Next.js + TypeScript + Tailwind
- **백엔드**: NestJS (Node.js/TypeScript) + PostgreSQL + Prisma
- **오프라인 동기화**: WatermelonDB 또는 SQLite + 자체 sync 큐
- **파일/미디어**: S3 호환 오브젝트 스토리지 (워터마크는 서버 sharp 처리)
- **알림**: FCM Push + 카카오 알림톡(비즈니스 메시징 API, 예: Solapi/NHN Cloud)
- **PDF 리포트**: 서버 사이드 HTML→PDF(Puppeteer) 또는 리포트 전용 서비스
- **인프라**: Docker + GitHub Actions CI/CD, Railway/Fly.io 또는 AWS

## 폴더 구조 (제안)

```
HnJAPP/
├── apps/
│   ├── mobile/          # React Native 앱 (현장점검자용)
│   ├── admin-web/       # Next.js 백오피스
│   └── api/             # NestJS 백엔드 API
├── packages/
│   ├── shared-types/    # API/DB 공용 타입
│   └── ui/              # (선택) 공용 컴포넌트
├── docs/
│   └── [SRS] ... v2.0.md
├── README.md
├── BUILD_PLAN.md
└── TODO.md
```

## 시작하기

```bash
npm install --legacy-peer-deps   # 루트에서 전체 workspace 설치

npm run dev:admin   # 관리자 웹 (Next.js, http://localhost:3000)
npm run dev:api     # API 서버 (NestJS)
npm run dev:mobile  # 모바일 앱 (Expo)
```

> ⚠️ `apps/api`는 Prisma 스키마까지만 작성된 상태입니다. `DATABASE_URL`을 `.env`에 설정하고
> (네트워크 제약이 없는 환경에서) `npx prisma generate && npx prisma migrate dev`를 한 번 실행해야
> API가 정상 동작합니다. 이 세션의 기기 네트워크 정책상 Prisma 엔진 바이너리 다운로드가 막혀 있어
> 직접 실행하지 못했습니다.

## 문서

- [`BUILD_PLAN.md`](./BUILD_PLAN.md) — 단계별 빌드 계획, 아키텍처, 일정
- [`TODO.md`](./TODO.md) — Phase별 실행 태스크 체크리스트
- [`docs/ERD.md`](./docs/ERD.md) — 데이터 모델 ERD (Draft)
- [`docs/API_SPEC.md`](./docs/API_SPEC.md) — API 명세서 (Draft)
- [`docs/DESIGN_TOKENS.md`](./docs/DESIGN_TOKENS.md) — 디자인 톤앤매너/컬러/컴포넌트 패턴
- `docs/[SRS] ...v2.0.md` — 원본 요구사항 정의서
