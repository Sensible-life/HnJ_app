import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsStore } from './tickets.store.js';

@Module({
  controllers: [TicketsController],
  providers: [TicketsStore],
  exports: [TicketsStore],
})
export class TicketsModule {}
