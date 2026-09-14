import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller.js';
import { ClientErrorStore } from './client-error.store.js';

@Module({
  controllers: [LogsController],
  providers: [ClientErrorStore],
})
export class LogsModule {}
