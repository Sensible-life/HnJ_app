import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller.js';
import { InspectionsModule } from '../inspections/inspections.module.js';

@Module({
  imports: [InspectionsModule],
  controllers: [StatsController],
})
export class StatsModule {}
