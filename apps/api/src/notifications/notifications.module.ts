import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationLogStore } from './notification-log.store.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationLogStore],
  exports: [NotificationsService],
})
export class NotificationsModule {}
