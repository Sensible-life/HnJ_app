import { Injectable } from '@nestjs/common';
import { ReportItemInput, ReportSessionInput } from '../reports/report.types.js';

export interface StoredInspection {
  session: ReportSessionInput;
  items: ReportItemInput[];
  reportWebUrl?: string;
  reportPdfUrl?: string;
  syncedAt: string;
}

/**
 * 임시 인메모리 저장소 (InspectionSession/InspectionItem 대응).
 * `/inspections/sync`로 들어온 완료 세션을 순서대로 보관해 관리자 웹의
 * 통계 대시보드/객실 타임라인 피드가 조회할 수 있게 한다.
 * DB(Prisma)가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class InspectionsStore {
  private records: StoredInspection[] = [];

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
