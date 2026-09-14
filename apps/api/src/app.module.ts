import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MediaModule } from './media/media.module.js';
import { InspectionsModule } from './inspections/inspections.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { HotelsModule } from './hotels/hotels.module.js';
import { UsersModule } from './users/users.module.js';
import { SchedulesModule } from './schedules/schedules.module.js';
import { StatsModule } from './stats/stats.module.js';
import { LogsModule } from './logs/logs.module.js';
import { CleaningTeamsModule } from './cleaning-teams/cleaning-teams.module.js';
import { RatesModule } from './rates/rates.module.js';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware.js';

// NOTE: PrismaModule / AuthModule은 여기서 잠시 제외했다.
// PrismaClient가 이 개발 환경 네트워크 정책상 아직 `prisma generate`로 생성되지 못했는데,
// PrismaService는 생성자에서 바로 PrismaClient를 만들기 때문에 앱 전체 부팅이 실패한다.
// 모바일 앱도 아직 로그인 화면이 로컬 상태값일 뿐 실제 /auth/login을 호출하지 않으므로,
// 지금은 두 모듈을 빼고 나머지 기능(체크인 동기화/미디어/리포트/알림/승인/관리자 기능)을
// 먼저 테스트할 수 있게 했다. Hotels/Users/Schedules/Stats 모듈도 같은 이유로
// 인메모리 Store로 구현되어 있다 (각 파일 상단 주석 참고).
// DB(DATABASE_URL) 준비 + `npx prisma generate`가 성공하는 환경이 되면 다시 추가하면 된다.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    MediaModule,
    ReportsModule,
    NotificationsModule,
    TicketsModule,
    InspectionsModule,
    HotelsModule,
    UsersModule,
    SchedulesModule,
    StatsModule,
    LogsModule,
    CleaningTeamsModule,
    RatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 오프라인 동기화/업로드 엔드포인트만 레이트리밋 (Phase 7 보안 점검 항목)
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'inspections/sync', method: RequestMethod.POST },
        { path: 'media/upload', method: RequestMethod.POST },
      );
  }
}
