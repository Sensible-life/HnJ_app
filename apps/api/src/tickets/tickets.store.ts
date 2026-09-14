import { Injectable } from '@nestjs/common';

export interface TicketRecord {
  token: string;
  hotelName: string;
  roomLabel: string;
  itemName: string;
  repairMaterial?: string | null;
  repairCost?: number | null;
  revisitDate?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REINSPECT_REQUESTED';
  createdAt: string;
  resolvedAt?: string;
  comment?: string;
}

/**
 * 임시 인메모리 저장소.
 * 이 개발 환경은 네트워크 정책상 Prisma Client 생성이 막혀 실제 DB 연동을 아직 못 붙였다.
 * DB가 붙으면 이 클래스를 PrismaService 기반 리포지토리로 교체하면 된다 (호출부 인터페이스는 유지).
 */
@Injectable()
export class TicketsStore {
  private tickets = new Map<string, TicketRecord>();

  create(ticket: Omit<TicketRecord, 'status' | 'createdAt'>): TicketRecord {
    const record: TicketRecord = {
      ...ticket,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.tickets.set(ticket.token, record);
    return record;
  }

  get(token: string): TicketRecord | undefined {
    return this.tickets.get(token);
  }

  resolve(token: string, status: 'APPROVED' | 'REINSPECT_REQUESTED', comment?: string) {
    const t = this.tickets.get(token);
    if (!t) return undefined;
    t.status = status;
    t.resolvedAt = new Date().toISOString();
    if (comment) t.comment = comment;
    return t;
  }

  list(): TicketRecord[] {
    return Array.from(this.tickets.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
