import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller.js';
import { SchedulesStore } from './schedules.store.js';
import { HotelsModule } from '../hotels/hotels.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [HotelsModule, UsersModule],
  controllers: [SchedulesController],
  providers: [SchedulesStore],
})
export class SchedulesModule {}
