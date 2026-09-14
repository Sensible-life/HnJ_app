import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * FR: "보안 점검" — TODO.md Phase 7.
 * `@nestjs/throttler`가 현재 NestJS 12와 peer dependency 충돌이 있어(6.x는 ^11까지만 지원),
 * 대신 의존성 없이 동작하는 간단한 고정 윈도우 in-memory 레이트리밋을 직접 구현했다.
 * 다중 인스턴스로 스케일 아웃하는 실제 운영 환경에서는 Redis 기반(예: nestjs-rate-limiter)으로
 * 교체해야 한다 (in-memory라 인스턴스별로 카운트가 분리됨).
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private hits = new Map<string, { count: number; windowStart: number }>();

  // 분당 60회 — 오프라인 동기화 재시도(FR-INSP-05)가 충분히 통과할 여유를 두면서도
  // 비정상적인 반복 호출은 막는 값. NestJS DI가 원시 타입 생성자 인자를 해석하지
  // 못하므로(별도 Provider 토큰이 필요) 여기서는 클래스 필드로 고정했다.
  private readonly limit = 60;
  private readonly windowMs = 60_000;

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > this.limit) {
      throw new HttpException('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', HttpStatus.TOO_MANY_REQUESTS);
    }
    next();
  }
}
