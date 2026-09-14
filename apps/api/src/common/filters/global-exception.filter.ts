import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * FR: "모니터링 도구 연동 (크래시/에러/알림 발송 실패 로그)" — TODO.md Phase 7.
 *
 * 모든 미처리 예외를 구조화된 형태로 로깅한다. 지금은 콘솔(Nest Logger)로만 남기지만,
 * 실제 운영 환경에서는 여기서 Sentry/Datadog 등 APM SDK로 그대로 전달하면 된다
 * (예: `Sentry.captureException(exception)`) — DSN 발급 등 외부 서비스 가입이
 * 필요해 이 개발 환경에서는 붙이지 못했다. ERROR_MONITORING_DSN 환경변수가 설정되면
 * 실제 전송을 붙이라는 TODO만 남겨둔다.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('UnhandledException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? exception.getResponse()
      : exception instanceof Error
        ? exception.message
        : '알 수 없는 서버 오류';

    // 구조화 로그: 운영 시 로그 수집기(ELK/CloudWatch 등)에서 검색/알림 규칙을 걸기 쉽도록
    // method/path/status/message를 한 줄에 담는다.
    this.logger.error(
      JSON.stringify({
        method: request.method,
        path: request.url,
        status,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    );

    // TODO(모니터링): process.env.ERROR_MONITORING_DSN 이 설정된 실제 운영 환경에서는
    // 여기서 Sentry.captureException(exception) 등을 호출해 실시간 알림을 받도록 교체.

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
