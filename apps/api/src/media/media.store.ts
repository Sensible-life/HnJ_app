import { Injectable } from '@nestjs/common';

export interface MediaRecord {
  id: string;
  url: string;
  sessionId?: string;
  itemId?: string;
  itemName?: string;
  mediaType: 'BEFORE' | 'AFTER' | 'GENERAL';
  hotelName: string;
  roomLabel: string;
  capturedAt: string;
}

/**
 * 임시 인메모리 저장소 (Media 모델 대응).
 * 관리자 웹 "객실 타임라인 피드"의 Before/After 스플릿 슬라이더 및
 * Quick-Draw 마킹 도구가 사진을 세션/항목 단위로 조회할 수 있게 색인해둔다.
 * DB가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class MediaStore {
  private records: MediaRecord[] = [];

  add(record: MediaRecord) {
    this.records.unshift(record);
  }

  listBySession(sessionId: string): MediaRecord[] {
    return this.records.filter((r) => r.sessionId === sessionId);
  }

  listByRoom(hotelName: string, roomLabel: string): MediaRecord[] {
    return this.records.filter((r) => r.hotelName === hotelName && r.roomLabel === roomLabel);
  }
}
