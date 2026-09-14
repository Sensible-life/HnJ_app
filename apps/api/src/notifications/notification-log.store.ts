import { Injectable } from '@nestjs/common';

export interface NotificationLogEntry {
  id: string;
  channel: 'ALIMTALK' | 'PUSH' | 'SMS';
  target: string;
  summary: string;
  status: 'SENT' | 'FAILED';
  error?: string;
  sentAt: string;
}

/**
 * FR: "모니터링 도구 연동 (크래시/에러/알림 발송 실패 로그)" — TODO.md Phase 7.
 * 알림톡/Push 발송 시도를 성공/실패와 함께 기록해 관리자 웹에서 확인할 수 있게 한다.
 * DB가 붙으면 Notification 모델 기반 리포지토리로 교체 가능 (필드가 거의 대응됨).
 */
@Injectable()
export class NotificationLogStore {
  private entries: NotificationLogEntry[] = [];
  private counter = 0;

  record(entry: Omit<NotificationLogEntry, 'id' | 'sentAt'>): NotificationLogEntry {
    this.counter += 1;
    const record: NotificationLogEntry = { ...entry, id: `notiflog_${this.counter}`, sentAt: new Date().toISOString() };
    this.entries.unshift(record);
    return record;
  }

  list(onlyFailed = false): NotificationLogEntry[] {
    return onlyFailed ? this.entries.filter((e) => e.status === 'FAILED') : this.entries;
  }
}
