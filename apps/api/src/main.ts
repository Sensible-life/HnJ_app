import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 보안 헤더 (Phase 7 보안 점검). 워터마크 합성 이미지/리포트 HTML을 그대로
  // <img>/<iframe> 등으로 임베드해서 보여주는 흐름이 있어 CSP는 기본값 대신
  // 완화된 정책을 쓴다 — 운영 도메인이 정해지면 directives를 좁혀야 한다.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // TODO(보안): 운영 배포 시 ALLOWED_ORIGIN(관리자 웹 도메인)으로 좁힐 것.
  // 지금은 모바일 앱(Expo Go 로컬 서버)·관리자 웹 로컬 개발 서버가 둘 다 붙어야 해서
  // 개발 환경 한정으로 전체 허용 상태를 유지한다.
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  app.enableCors(allowedOrigin ? { origin: allowedOrigin } : undefined);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  // TODO(보안/배포): HTTPS/TLS 1.3 자체는 이 앱 코드가 아니라 배포 인프라(리버스 프록시:
  // nginx/Caddy + Let's Encrypt, 또는 로드밸런서 단 TLS termination)에서 구성해야 한다.
  // 이 개발 환경에는 실제 도메인/인증서가 없어 로컬에서는 HTTP로만 구동하고,
  // 운영 배포 체크리스트는 docs/QA_CHECKLIST.md 에 별도로 정리해뒀다.
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
