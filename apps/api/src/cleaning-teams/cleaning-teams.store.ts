import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface CleaningTeamRecord {
  id: string;
  name: string;
}

/**
 * 임시 인메모리 저장소 (CleaningTeam 모델 대응).
 * FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소 담당팀 기록, 청소팀별 인스펙션 점수 집계.
 * DB가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class CleaningTeamsStore {
  private teams = new Map<string, CleaningTeamRecord>();

  constructor() {
    const seed: CleaningTeamRecord[] = [
      { id: 'team_a', name: 'A팀' },
      { id: 'team_b', name: 'B팀' },
      { id: 'team_c', name: 'C팀' },
    ];
    for (const t of seed) this.teams.set(t.id, t);
  }

  list(): CleaningTeamRecord[] {
    return Array.from(this.teams.values());
  }

  create(name: string): CleaningTeamRecord {
    const record: CleaningTeamRecord = { id: `team_${randomUUID()}`, name };
    this.teams.set(record.id, record);
    return record;
  }

  findByName(name: string): CleaningTeamRecord | undefined {
    return this.list().find((t) => t.name === name);
  }
}
