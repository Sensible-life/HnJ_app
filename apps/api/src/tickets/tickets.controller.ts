import { Controller, Get, Post, Param, Body, NotFoundException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TicketsStore } from './tickets.store.js';
import { renderApprovalPage } from './approval-page.util.js';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsStore: TicketsStore) {}

  @Get('tickets')
  list() {
    return this.ticketsStore.list();
  }

  // 카카오 알림톡 / Push 안의 "1-Click 승인" 링크가 여는 비로그인 웹뷰 페이지 (FR-REP-02)
  @Get('approve/:token')
  view(@Param('token') token: string, @Res() res: Response) {
    const ticket = this.ticketsStore.get(token);
    if (!ticket) throw new NotFoundException('유효하지 않은 승인 링크입니다.');
    res.type('html').send(renderApprovalPage(ticket));
  }

  @Post('approve/:token/approve')
  approve(@Param('token') token: string, @Body('comment') comment: string | undefined, @Res() res: Response) {
    const ticket = this.ticketsStore.resolve(token, 'APPROVED', comment);
    if (!ticket) throw new NotFoundException('유효하지 않은 승인 링크입니다.');
    res.type('html').send(renderApprovalPage(ticket));
  }

  @Post('approve/:token/reinspect')
  reinspect(@Param('token') token: string, @Body('comment') comment: string | undefined, @Res() res: Response) {
    const ticket = this.ticketsStore.resolve(token, 'REINSPECT_REQUESTED', comment);
    if (!ticket) throw new NotFoundException('유효하지 않은 승인 링크입니다.');
    res.type('html').send(renderApprovalPage(ticket));
  }
}
