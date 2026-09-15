import { Injectable } from '@nestjs/common';
import { ReportItemInput, ReportSessionInput } from '../reports/report.types.js';

export interface StoredInspection {
  session: ReportSessionInput;
  items: ReportItemInput[];
  reportWebUrl?: string;
  reportPdfUrl?: string;
  syncedAt: string;
}

// FR-QA: 관리자 웹 대시보드/통계 화면을 빈 화면으로 보여주지 않기 위한 데모 데이터.
// 서버가 (재)시작될 때마다 딱 한 번 인메모리 스토어에 채워 넣는다.
// 실제 모바일에서 /inspections/sync로 들어오는 진짜 데이터와 같은 배열에 섞여 들어가며,
// DB(Prisma) 연동 시에는 이 seedDemoRecords 호출 자체를 지우면 된다.
function daysAgoIso(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedDemoRecords(): StoredInspection[] {
  const raw: {
    daysAgo: number;
    hotel: string;
    room: string;
    type: 'ROOM_PRO' | 'BATH_PRO';
    inspector: string;
    team: string;
    items: ReportItemInput[];
  }[] = [
    {
      daysAgo: 0,
      hotel: '그랜드 워커힐',
      room: '1201호',
      type: 'ROOM_PRO',
      inspector: '김점검',
      team: 'A팀',
      items: [
        { item_name: '침구 상태', state: 'NORMAL' },
        { item_name: '화장실 배수', state: 'CAUTION', problem_description: '배수 속도 느림', photo_count: 1 },
        { item_name: '냉장고 작동', state: 'NORMAL' },
      ],
    },
    {
      daysAgo: 0,
      hotel: '신라 부산',
      room: '803호',
      type: 'BATH_PRO',
      inspector: '이점검',
      team: 'B팀',
      items: [
        { item_name: '욕조 배수', state: 'NORMAL' },
        { item_name: '샤워부스 곰팡이', state: 'URGENT', problem_description: '실리콘 곰팡이 심함', issue_type: '곰팡이', photo_count: 2, requires_hotel_approval: true },
      ],
    },
    {
      daysAgo: 1,
      hotel: '롯데 제주',
      room: '2104호',
      type: 'ROOM_PRO',
      inspector: '이점검',
      team: 'A팀',
      items: [
        { item_name: '카펫 얼룩', state: 'CAUTION', problem_description: '얼룩 제거 불가, 교체 필요', requires_hotel_approval: true, photo_count: 3 },
        { item_name: '에어컨 냉방', state: 'NORMAL' },
      ],
    },
    {
      daysAgo: 1,
      hotel: '그랜드 워커힐',
      room: '905호',
      type: 'BATH_PRO',
      inspector: '김점검',
      team: 'A팀',
      items: [
        { item_name: '욕조 배수', state: 'NORMAL' },
        { item_name: '변기 상태', state: 'NORMAL' },
      ],
    },
    {
      daysAgo: 2,
      hotel: '신라 부산',
      room: '1105호',
      type: 'ROOM_PRO',
      inspector: '박점검',
      team: 'B팀',
      items: [
        { item_name: '에어컨 냉방', state: 'URGENT', problem_description: '냉방 전혀 안 됨, 콤프레서 이상 의심', photo_count: 2, requires_hotel_approval: true },
        { item_name: '창문 개폐', state: 'NORMAL' },
      ],
    },
    {
      daysAgo: 3,
      hotel: '그랜드 워커힐',
      room: '1502호',
      type: 'ROOM_PRO',
      inspector: '김점검',
      team: 'A팀',
      items: [
        { item_name: '침구 상태', state: 'NORMAL' },
        { item_name: '냄새', state: 'CAUTION', issue_type: '악취', problem_description: '담배 냄새 잔여' },
      ],
    },
    {
      daysAgo: 4,
      hotel: '롯데 제주',
      room: '901호',
      type: 'BATH_PRO',
      inspector: '박점검',
      team: 'B팀',
      items: [
        { item_name: '욕조 배수', state: 'CAUTION', problem_description: '배수 느림' },
        { item_name: '샤워부스 곰팡이', state: 'NORMAL' },
      ],
    },
    {
      daysAgo: 5,
      hotel: '신라 부산',
      room: '803호',
      type: 'BATH_PRO',
      inspector: '이점검',
      team: 'B팀',
      items: [
        { item_name: '샤워부스 곰팡이', state: 'URGENT', issue_type: '곰팡이', problem_description: '재발, 지난 점검서도 지적됨', requires_hotel_approval: true },
      ],
    },
    {
      daysAgo: 6,
      hotel: '그랜드 워커힐',
      room: '1201호',
      type: 'ROOM_PRO',
      inspector: '김점검',
      team: 'A팀',
      items: [
        { item_name: '침구 상태', state: 'NORMAL' },
        { item_name: '화장실 배수', state: 'NORMAL' },
      ],
    },
    {
      daysAgo: 8,
      hotel: '롯데 제주',
      room: '2104호',
      type: 'ROOM_PRO',
      inspector: '이점검',
      team: 'A팀',
      items: [
        { item_name: '카펫 얼룩', state: 'NORMAL' },
        { item_name: '에어컨 냉방', state: 'CAUTION', problem_description: '미풍만 나옴' },
      ],
    },
  ];

  return raw.map((r, idx) => {
    const startedAt = daysAgoIso(r.daysAgo, 9 + (idx % 6), 10);
    const completedAt = daysAgoIso(r.daysAgo, 9 + (idx % 6), 40);
    const session: ReportSessionInput = {
      id: `seed-${idx + 1}`,
      hotel_name: r.hotel,
      room_label: r.room,
      type: r.type,
      started_at: startedAt,
      completed_at: completedAt,
      inspector_name: r.inspector,
      service_type: 'REGULAR',
      cleaning_team: r.team,
      cleaning_completed_at: completedAt,
    };
    return { session, items: r.items, syncedAt: completedAt };
  });
}

/**
 * 임시 인메모리 저장소 (InspectionSession/InspectionItem 대응).
 * `/inspections/sync`로 들어온 완료 세션을 순서대로 보관해 관리자 웹의
 * 통계 대시보드/객실 타임라인 피드가 조회할 수 있게 한다.
 * DB(Prisma)가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class InspectionsStore {
  private records: StoredInspection[] = seedDemoRecords();

  add(record: StoredInspection) {
    // 같은 clientUuid(세션 id)로 재동기화되면 기존 레코드를 덮어쓴다.
    this.records = this.records.filter((r) => r.session.id !== record.session.id);
    this.records.unshift(record);
  }

  list(filter?: { hotelName?: string; type?: 'ROOM_PRO' | 'BATH_PRO' }): StoredInspection[] {
    return this.records.filter((r) => {
      if (filter?.hotelName && r.session.hotel_name !== filter.hotelName) return false;
      if (filter?.type && r.session.type !== filter.type) return false;
      return true;
    });
  }

  get(sessionId: string): StoredInspection | undefined {
    return this.records.find((r) => r.session.id === sessionId);
  }

  listByRoom(hotelName: string, roomLabel: string): StoredInspection[] {
    return this.records.filter((r) => r.session.hotel_name === hotelName && r.session.room_label === roomLabel);
  }

  all(): StoredInspection[] {
    return this.records;
  }
}
