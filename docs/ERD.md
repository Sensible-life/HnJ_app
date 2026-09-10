# ERD (초안) — BATH PRO / ROOM PRO

> 상태: **Draft** — 개발 진행하며 계속 수정 예정. 확정본 아님.
> 근거: `BUILD_PLAN.md` 2장 데이터 모델 초안 + SRS v2.0

## 다이어그램

```mermaid
erDiagram
    HOTEL ||--o{ ROOM : has
    HOTEL ||--o{ SCHEDULE : has
    HOTEL }o--o{ USER : "담당자 매핑"
    USER ||--o{ INSPECTION_SESSION : performs
    ROOM ||--o{ INSPECTION_SESSION : "inspected in"
    INSPECTION_SESSION ||--o{ INSPECTION_ITEM : contains
    INSPECTION_SESSION ||--o| REPORT : generates
    INSPECTION_SESSION |o--o| INSPECTION_SESSION : "ROOM PRO -> BATH PRO 연동"
    INSPECTION_ITEM ||--o{ MEDIA : has
    INSPECTION_ITEM ||--o{ ISSUE_TICKET : "creates (주의/긴급)"
    ISSUE_TICKET ||--o{ NOTIFICATION : triggers
    USER ||--o{ SCHEDULE : "assigned to"

    USER {
        uuid id PK
        string name
        string email
        string phone
        enum role "현장점검자|호텔담당자|본사관리자"
        datetime createdAt
    }
    HOTEL {
        uuid id PK
        string name
        string address
        string region
    }
    ROOM {
        uuid id PK
        uuid hotelId FK
        string building
        string floor
        string roomNumber
        string qrTagId
        string nfcTagId
    }
    INSPECTION_SESSION {
        uuid id PK
        uuid roomId FK
        uuid inspectorId FK
        uuid parentSessionId FK "ROOM PRO에서 연동된 BATH PRO 세션"
        enum type "ROOM_PRO|BATH_PRO"
        enum status "IN_PROGRESS|COMPLETED|SYNCED_PENDING"
        enum checkinMethod "QR|NFC"
        float gpsLat
        float gpsLng
        datetime startedAt
        datetime completedAt
    }
    INSPECTION_ITEM {
        uuid id PK
        uuid sessionId FK
        string category
        string itemName
        enum state "UNSET|NORMAL|CAUTION|URGENT"
        string comment
        int sortOrder
    }
    MEDIA {
        uuid id PK
        uuid itemId FK
        string url
        enum mediaType "BEFORE|AFTER|GENERAL"
        json watermarkMeta "호텔명/객실번호/촬영일시"
        json markingData "Quick-Draw 오버레이 좌표"
        datetime uploadedAt
    }
    ISSUE_TICKET {
        uuid id PK
        uuid itemId FK
        enum status "PENDING|APPROVED|REINSPECT_REQUESTED|RESOLVED"
        string repairMaterial
        int repairCost
        date revisitDate
        uuid approvedBy FK
        datetime approvedAt
        string comment
    }
    REPORT {
        uuid id PK
        uuid sessionId FK
        string pdfUrl
        string webUrl
        datetime generatedAt
    }
    NOTIFICATION {
        uuid id PK
        uuid ticketId FK
        uuid targetUserId FK
        enum channel "ALIMTALK|PUSH"
        enum status "SENT|FAILED|CLICKED"
        string actionToken "1-Click 승인용 웹뷰 토큰"
        datetime sentAt
    }
    SCHEDULE {
        uuid id PK
        uuid hotelId FK
        uuid assignedUserId FK
        int visitsPerMonth "2~4"
        date nextVisitDate
        date lastVisitDate
    }
```

## 확정이 필요한 부분 (TODO)

- [ ] `INSPECTION_ITEM`의 category/itemName을 코드 테이블(마스터 데이터)로 뺄지, 문자열로 둘지 결정 — ROOM PRO 15개 구역 / BATH PRO 12개 구역이 고정이라면 마스터 테이블 권장
- [ ] `IssueTicket`이 `InspectionItem` 1:1인지, 여러 항목을 묶어 하나의 티켓으로 만들 수도 있는지 (SRS엔 항목 단위로 보임)
- [ ] `User`-`Hotel` 다대다 매핑 테이블(`UserHotelMapping`) 컬럼: 역할별로 매핑 의미가 다를 수 있음 (호텔담당자는 1:N, 현장점검자는 스케줄 기반 배정)
- [ ] 오프라인 동기화 충돌 시 `InspectionSession`/`InspectionItem`에 버전/updatedAt 기반 충돌 해소 컬럼 필요 여부
- [ ] Soft delete 여부 (deletedAt) — 점검 이력은 감사 목적상 삭제보다 상태 변경으로 처리 권장
