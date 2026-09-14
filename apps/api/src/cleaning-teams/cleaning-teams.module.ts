import { Module } from '@nestjs/common';
import { CleaningTeamsController } from './cleaning-teams.controller.js';
import { CleaningTeamsStore } from './cleaning-teams.store.js';

@Module({
  controllers: [CleaningTeamsController],
  providers: [CleaningTeamsStore],
  exports: [CleaningTeamsStore],
})
export class CleaningTeamsModule {}
