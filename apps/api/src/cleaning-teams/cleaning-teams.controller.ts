import { Body, Controller, Get, Post } from '@nestjs/common';
import { CleaningTeamsStore } from './cleaning-teams.store.js';

// FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소 담당팀 선택/등록
@Controller('cleaning-teams')
export class CleaningTeamsController {
  constructor(private readonly store: CleaningTeamsStore) {}

  @Get()
  list() {
    return this.store.list();
  }

  @Post()
  create(@Body('name') name: string) {
    return this.store.create(name);
  }
}
