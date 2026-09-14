import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '../common/enums/role.enum.js';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  hotelIds: string[];
  createdAt: string;
}

/**
 * 임시 인메모리 저장소 (User + UserHotelMapping 대응, passwordHash는 관리자 웹에서 다루지 않으므로 생략).
 * DB가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class UsersStore {
  private users = new Map<string, UserRecord>();

  constructor() {
    const seed: UserRecord[] = [
      {
        id: 'user_admin',
        name: '김본사',
        email: 'admin@hnjapp.local',
        phone: '010-1111-2222',
        role: Role.HQ_ADMIN,
        hotelIds: ['hotel_gw', 'hotel_sb', 'hotel_lj'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_inspector_1',
        name: '박점검',
        email: 'inspector1@hnjapp.local',
        phone: '010-3333-4444',
        role: Role.INSPECTOR,
        hotelIds: ['hotel_gw'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_manager_1',
        name: '이담당',
        email: 'manager1@hnjapp.local',
        phone: '010-5555-6666',
        role: Role.HOTEL_MANAGER,
        hotelIds: ['hotel_gw'],
        createdAt: new Date().toISOString(),
      },
    ];
    for (const u of seed) this.users.set(u.id, u);
  }

  list(): UserRecord[] {
    return Array.from(this.users.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  create(input: { name: string; email: string; phone?: string; role: Role; hotelIds: string[] }): UserRecord {
    const record: UserRecord = {
      id: `user_${randomUUID()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      hotelIds: input.hotelIds,
      createdAt: new Date().toISOString(),
    };
    this.users.set(record.id, record);
    return record;
  }

  update(id: string, patch: Partial<Pick<UserRecord, 'name' | 'phone' | 'role' | 'hotelIds'>>): UserRecord | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    Object.assign(user, patch);
    return user;
  }
}
