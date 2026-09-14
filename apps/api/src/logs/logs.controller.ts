import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClientErrorStore } from './client-error.store.js';

interface ReportErrorBody {
  platform: 'mobile' | 'admin-web';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

@Controller()
export class LogsController {
  constructor(private readonly clientErrorStore: ClientErrorStore) {}

  // 모바일/관리자 웹의 전역 에러 바운더리가 크래시·미처리 예외를 보고하는 엔드포인트
  @Post('logs/client-error')
  report(@Body() body: ReportErrorBody) {
    return this.clientErrorStore.record(body);
  }

  @Get('admin/logs/client-errors')
  list() {
    return this.clientErrorStore.list();
  }
}
