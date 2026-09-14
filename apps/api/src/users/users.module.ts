import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersStore } from './users.store.js';

@Module({
  controllers: [UsersController],
  providers: [UsersStore],
  exports: [UsersStore],
})
export class UsersModule {}
