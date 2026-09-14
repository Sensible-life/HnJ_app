import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { ReportsService } from '../reports/reports.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TicketsStore } from '../tickets/tickets.store.js';
import { ReportItemInput, ReportSessionInput } from '../reports/report.types.js';
import { InspectionsStore } from './inspections.store.js';

interface SyncBody {
  clientUuid: string;
  session: ReportSessionInput;
  items: ReportItemInput[];
}

@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly notifications: NotificationsService,
    private readonly ticketsStore: TicketsStore,
    private readonly inspectionsStore: InspectionsStore,
  ) {}

  // FR-INSP-05 오프라인 동기화 수신 + FR-REP-01/02 리포트 생성/알림 발송을 한번에 처리한다.
  // TODO: DB(Prisma) 연동 후에는 세션/항목을 실제 테이블에 upsert 하도록 교체
  @Post('sync')
  async sync(@Body() body: SyncBody, @Req() req: Request) {
    const { session, items } = body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const report = await this.reportsService.generateAndSave(session, items);

    this.inspectionsStore.add({
      session,
      items,
      reportWebUrl: report.webUrl,
      reportPdfUrl: report.pdfUrl,
      syncedAt: new Date().toISOString(),
    });

    const urgentItems = items.filter((i) => i.state === 'URGENT');
    const tickets = [];
    for (const item of urgentItems) {
      const token = randomUUID();
      const ticket = this.ticketsStore.create({
        token,
        hotelName: session.hotel_name,
        roomLabel: session.room_label,
        itemName: item.item_name,
        repairMaterial: item.repair_material ?? null,
        repairCost: item.repair_cost ?? null,
        revisitDate: item.revisit_date ?? null,
      });
      const actionUrl = `${baseUrl}/approve/${token}`;
      await this.notifications.sendAlimtalk({
        targetName: '호텔 담당자',
        hotelName: session.hotel_name,
        roomLabel: session.room_label,
        itemName: item.item_name,
        actionUrl,
      });
      tickets.push({ token, actionUrl });
    }

    return {
      sessionId: session.id,
      report,
      ticketsCreated: tickets.length,
      tickets,
    };
  }

  // 관리자 웹 통계 대시보드 / 객실 타임라인 피드가 동기화된 세션을 조회하는 용도.
  @Get()
  list(@Query('hotelName') hotelName?: string, @Query('type') type?: 'ROOM_PRO' | 'BATH_PRO') {
    return this.inspectionsStore.list({ hotelName, type });
  }

  @Get('room')
  byRoom(@Query('hotelName') hotelName: string, @Query('roomLabel') roomLabel: string) {
    return this.inspectionsStore.listByRoom(hotelName, roomLabel);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.inspectionsStore.get(id);
  }
}
