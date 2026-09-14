import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller.js';
import { HotelsStore } from './hotels.store.js';

@Module({
  controllers: [HotelsController],
  providers: [HotelsStore],
  exports: [HotelsStore],
})
export class HotelsModule {}
