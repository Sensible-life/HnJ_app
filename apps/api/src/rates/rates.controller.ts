import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { RatesStore } from './rates.store.js';
import { CreateRateDto } from './dto/create-rate.dto.js';
import { UpdateRateDto } from './dto/update-rate.dto.js';

// FR: docs/FEATURE_SCOPE.md 우선순위 C — 요금 관리 (호텔앤잡 관리자 권한)
@Controller('admin/rates')
export class RatesController {
  constructor(private readonly store: RatesStore) {}

  @Get()
  list() {
    return this.store.list();
  }

  @Get('resolve')
  resolve(@Query('hotelId') hotelId: string | undefined, @Query('serviceType') serviceType: string) {
    return this.store.resolve(hotelId ?? null, serviceType as any) ?? null;
  }

  @Post()
  create(@Body() dto: CreateRateDto) {
    return this.store.create({ ...dto, hotelId: dto.hotelId ?? null });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRateDto) {
    const updated = this.store.update(id, dto);
    if (!updated) throw new NotFoundException('요금 정보를 찾을 수 없습니다.');
    return updated;
  }
}
