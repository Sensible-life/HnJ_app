import { Controller, Get, Query } from '@nestjs/common';
import { NotificationLogStore } from './notification-log.store.js';

// FR: "모니터링 도구 연동 (크래시/에러/알림 발송 실패 로그)" — TODO.md Phase 7.
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationLog: NotificationLogStore) {}

  @Get('log')
  list(@Query('failedOnly') failedOnly?: string) {
    return this.notificationLog.list(failedOnly === 'true');
  }
}
