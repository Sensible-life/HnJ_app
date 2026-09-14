import { Controller, Get } from '@nestjs/common';
import { HotelsStore } from './hotels.store.js';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsStore: HotelsStore) {}

  @Get()
  list() {
    return this.hotelsStore.list();
  }
}
