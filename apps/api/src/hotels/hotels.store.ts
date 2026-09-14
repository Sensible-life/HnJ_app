import { Injectable } from '@nestjs/common';

export interface HotelRecord {
  id: string;
  name: string;
  address: string;
  region: string;
}

/**
 * 임시 인메모리 저장소 (Hotel 모델 대응).
 * Prisma Client 생성이 막혀있는 동안, 모바일 CheckInScreen에서 쓰는 호텔명과
 * 맞춰 둔 시드 데이터로 관리자 웹의 일정/사용자 화면 드롭다운을 채운다.
 * DB가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class HotelsStore {
  private hotels = new Map<string, HotelRecord>();

  constructor() {
    const seed: HotelRecord[] = [
      { id: 'hotel_gw', name: '그랜드 워커힐', address: '서울 광진구 워커힐로 177', region: '서울' },
      { id: 'hotel_sb', name: '신라 부산', address: '부산 해운대구 달맞이길 62번길', region: '부산' },
      { id: 'hotel_lj', name: '롯데호텔 제주', address: '제주 서귀포시 중문관광로 72번길', region: '제주' },
    ];
    for (const h of seed) this.hotels.set(h.id, h);
  }

  list(): HotelRecord[] {
    return Array.from(this.hotels.values());
  }

  get(id: string): HotelRecord | undefined {
    return this.hotels.get(id);
  }

  findByName(name: string): HotelRecord | undefined {
    return this.list().find((h) => h.name === name);
  }
}
