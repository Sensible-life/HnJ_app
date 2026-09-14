import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type ServiceType = 'INITIAL_RENEWAL' | 'REGULAR' | 'EMERGENCY' | 'REINSPECTION';

export interface RateRecord {
  id: string;
  hotelId: string | null; // null = 전체 호텔 공통 기본 요금
  serviceType: ServiceType;
  price: number;
  unit: string;
  note: string | null;
  updatedAt: string;
}

/**
 * 임시 인메모리 저장소 (ServiceRate 모델 대응).
 * FR: docs/FEATURE_SCOPE.md 우선순위 C — 요금 관리 (호텔앤잡 관리자 권한).
 * DB가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class RatesStore {
  private rates = new Map<string, RateRecord>();

  constructor() {
    const now = new Date().toISOString();
    const seed: RateRecord[] = [
      { id: 'rate_default_regular', hotelId: null, serviceType: 'REGULAR', price: 150000, unit: '건', note: '기본 정기점검 요금', updatedAt: now },
      { id: 'rate_default_initial', hotelId: null, serviceType: 'INITIAL_RENEWAL', price: 300000, unit: '건', note: '기본 최초 리뉴얼 요금', updatedAt: now },
      { id: 'rate_default_emergency', hotelId: null, serviceType: 'EMERGENCY', price: 250000, unit: '건', note: '기본 긴급출동 요금', updatedAt: now },
      { id: 'rate_default_reinspection', hotelId: null, serviceType: 'REINSPECTION', price: 80000, unit: '건', note: '기본 재점검 요금', updatedAt: now },
    ];
    for (const r of seed) this.rates.set(r.id, r);
  }

  list(): RateRecord[] {
    return Array.from(this.rates.values()).sort((a, b) => a.serviceType.localeCompare(b.serviceType));
  }

  create(input: { hotelId: string | null; serviceType: ServiceType; price: number; unit?: string; note?: string | null }): RateRecord {
    const record: RateRecord = {
      id: `rate_${randomUUID()}`,
      hotelId: input.hotelId,
      serviceType: input.serviceType,
      price: input.price,
      unit: input.unit ?? '건',
      note: input.note ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.rates.set(record.id, record);
    return record;
  }

  update(id: string, patch: Partial<Pick<RateRecord, 'price' | 'unit' | 'note'>>): RateRecord | undefined {
    const r = this.rates.get(id);
    if (!r) return undefined;
    Object.assign(r, patch, { updatedAt: new Date().toISOString() });
    return r;
  }

  // 호텔별 요금이 있으면 우선 적용, 없으면 서비스 구분 기본 요금으로 폴백
  resolve(hotelId: string | null, serviceType: ServiceType): RateRecord | undefined {
    const hotelSpecific = this.list().find((r) => r.hotelId === hotelId && r.serviceType === serviceType);
    if (hotelSpecific) return hotelSpecific;
    return this.list().find((r) => r.hotelId === null && r.serviceType === serviceType);
  }
}
