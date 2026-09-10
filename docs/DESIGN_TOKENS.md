# Design Tokens — BATH PRO / ROOM PRO

> 근거: 사용자가 공유한 레퍼런스 앱 스크린샷(Statistics/FitBot/Reserve/Payments/Exercise/Achievements 등, 피트니스 앱 톤) + Figma "Mobile APP UI Prototype" 프레임. 이 스크린샷들이 최종 톤앤매너 기준.

## 톤앤매너
- 배경은 순백(White), 섹션 구분에만 아주 옅은 그레이 밴드 사용 (예: 날짜 스트립)
- 카드: 흰 배경 + 큰 라운드 코너(~20~24px) + 은은한 그림자, 여백 넉넉
- 헤더/타이틀: 굵고 큰 블랙 텍스트 (예: "Statistics", "Overview") — 친근하지만 신뢰감 있는 톤
- 아이콘: 옅은 블루 원형 배경 안에 블루 라인 아이콘 (물방울/시계/덤벨 등)
- 통계 숫자: 매우 굵고 크게, 라벨은 작고 연한 그레이
- 진행률 링(도넛 차트) 여러 겹으로 블루/코랄/옐로우 색 사용해 다중 지표 동시 표시
- 하단 네비게이션: 흰 필(pill) 컨테이너, 활성 탭은 블랙 필 배경 + 흰 텍스트/아이콘, 비활성은 회색 아웃라인 아이콘
- 챗봇 화면: 상대 말풍선 연한 그레이, 내 말풍선 블루(진한 블루 강조 버블은 더 진한 블루)
- 상태 배지(Paid 등): 연한 그린 배경 + 그린 텍스트, 캡슐 형태
- 전체적으로 "깔끔한 헬스/웰니스 SaaS" 톤 — 과한 장식 없이 화이트 스페이스와 컬러 포인트로 정보 위계 표현

## 컬러
| 토큰 | 값(추정, 스크린샷 기반) | 용도 |
| --- | --- | --- |
| `color.bg.page` | `#FFFFFF` | 전체 배경 |
| `color.bg.subtle` | `#F5F6F8` | 날짜 스트립 등 옅은 구획 배경 |
| `color.bg.card` | `#FFFFFF` (shadow: 0 4px 16px rgba(0,0,0,0.06)) | 카드 |
| `color.primary` | `#2F6FED` 계열 (블루) | 버튼, 선택 상태, 링크, 진행바 기본색 |
| `color.primary.soft` | `#EAF2FF` | 아이콘 원형 배경, 연한 강조 |
| `color.accent.coral` | `#F76C6C` 계열 | 두 번째 진행 지표(Calories), 긴급/경고 포인트 컬러로 재사용 가능 |
| `color.accent.amber` | `#FDBA5C` 계열 | 세 번째 진행 지표(Steps), 주의(Caution) 상태에 재사용 |
| `color.status.success` | `#16A34A` 계열 / bg `#DCFCE7` | Paid, 정상(Normal) 상태 |
| `color.status.urgent` | `#DC2626` 계열 | 긴급 상태 (레퍼런스엔 없지만 코랄 계열과 구분되게 더 진한 레드로 지정) |
| `color.text.primary` | `#111827` | 헤더, 본문 |
| `color.text.secondary` | `#8A8F98` | 보조 라벨 |
| `color.nav.activeBg` | `#111827` (블랙) | 하단 네비 활성 탭 배경 |

## 타이포그래피
- 헤더(H1): Bold, 28~32px, 블랙 — "Statistics", "Payments" 등
- 섹션 타이틀(H2): Bold/SemiBold, 18~20px — "Overview", "Daily progress"
- 통계 큰 숫자: Bold/ExtraBold, 22~28px
- 본문/라벨: Regular~Medium, 13~15px, 그레이
- 폰트 패밀리: 라운드감 있는 모던 산세리프 (Pretendard, 또는 Inter/SF Pro 계열로 대체 가능) — 실제 폰트 확정 필요

## 컴포넌트 패턴 (재사용)
- Stat Card: 원형 아이콘 배지 + 큰 숫자 + 작은 라벨, 3개를 가로로 배치
- Multi-ring Donut: 여러 지표를 겹겹이 도넛 형태로 (ROOM PRO/BATH PRO 종합 진행률 화면에 응용 가능)
- Segmented Date/Floor Selector: 가로 스크롤 pill 버튼 (요일 선택 → 층/객실 선택에 그대로 응용)
- Bottom Pill Nav: 홈/검색/통계/프로필 4탭, 활성 탭만 블랙 필로 강조 — BATH PRO/ROOM PRO 앱의 하단 탭(홈/현장점검/리포트/이력/설정)에 적용
- Chat-style 1-Click 승인 UI: FitBot 말풍선 패턴을 알림톡 웹뷰 승인 화면에 응용 가능 (승인/재점검 요청을 버튼형 말풍선으로)
- Status Badge: 캡슐형 배경 + 텍스트 (Paid/정상/주의/긴급에 컬러만 교체)

## TODO
- [ ] 정확한 hex/spacing/radius는 실제 디자이너 확정본(Figma Dev Mode) 또는 디자인 시스템 문서로 교체
- [ ] 사용 폰트 최종 확정 및 라이선스 확인
- [ ] `packages/design-tokens`로 코드화하여 Tailwind config(admin-web) + RN theme(mobile) 공용으로 사용
