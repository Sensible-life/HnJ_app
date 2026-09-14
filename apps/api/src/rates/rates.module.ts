import { Module } from '@nestjs/common';
import { RatesController } from './rates.controller.js';
import { RatesStore } from './rates.store.js';

@Module({
  controllers: [RatesController],
  providers: [RatesStore],
  exports: [RatesStore],
})
export class RatesModule {}
