import { Injectable } from '@nestjs/common';

export interface ClientErrorEntry {
  id: string;
  platform: 'mobile' | 'admin-web';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  occurredAt: string;
}

/**
 * FR: "모니터링 도구 연동 (크래시/에러/알림 발송 실패 로그)" — TODO.md Phase 7.
 * 모바일 앱 / 관리자 웹의 전역 에러 바운더리가 여기로 크래시·예외를 보고한다.
 * DB가 붙으면 별도 테이블 또는 외부 APM(Sentry 등)으로 대체 가능.
 */
@Injectable()
export class ClientErrorStore {
  private entries: ClientErrorEntry[] = [];
  private counter = 0;

  record(input: Omit<ClientErrorEntry, 'id' | 'occurredAt'>): ClientErrorEntry {
    this.counter += 1;
    const entry: ClientErrorEntry = { ...input, id: `clienterr_${this.counter}`, occurredAt: new Date().toISOString() };
    this.entries.unshift(entry);
    if (this.entries.length > 500) this.entries.length = 500; // 메모리 보호용 상한
    return entry;
  }

  list(): ClientErrorEntry[] {
    return this.entries;
  }
}
