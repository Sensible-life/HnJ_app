import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { UsersStore } from './users.store.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

// API_SPEC.md 8장: GET/POST /admin/users
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersStore: UsersStore) {}

  @Get()
  list() {
    return this.usersStore.list();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersStore.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = this.usersStore.update(id, dto);
    if (!updated) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return updated;
  }
}
