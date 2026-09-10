import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MediaModule } from './media/media.module.js';
import { InspectionsModule } from './inspections/inspections.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { TicketsModule } from './tickets/tickets.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    MediaModule,
    ReportsModule,
    NotificationsModule,
    TicketsModule,
    InspectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
