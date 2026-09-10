import { Module } from '@nestjs/common';
import { InspectionsController } from './inspections.controller.js';
import { ReportsModule } from '../reports/reports.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';

@Module({
  imports: [ReportsModule, NotificationsModule, TicketsModule],
  controllers: [InspectionsController],
})
export class InspectionsModule {}
