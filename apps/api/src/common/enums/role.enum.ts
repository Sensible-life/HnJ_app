// NOTE: Prisma Client 자동생성(`npx prisma generate`)이 네트워크 정책상 이 개발 환경에서
// 실행되지 않아, RBAC 등 컴파일 타임에 필요한 곳은 schema.prisma의 enum Role과 동일한
// 로컬 enum을 대신 사용한다. `npx prisma generate`가 정상 동작하는 환경에서는
// `import { Role } from '@prisma/client'`로 교체해도 된다 (값은 schema.prisma와 반드시 일치시킬 것).
export enum Role {
  INSPECTOR = 'INSPECTOR',
  HOTEL_MANAGER = 'HOTEL_MANAGER',
  HQ_ADMIN = 'HQ_ADMIN',
}
