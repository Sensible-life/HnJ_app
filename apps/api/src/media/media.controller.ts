import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service.js';
import { MediaStore } from './media.store.js';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaStore: MediaStore,
  ) {}

  @Post('upload')
  // 동영상 업로드(우선순위 C)를 고려해 사진보다 넉넉한 50MB로 제한
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('hotelName') hotelName: string,
    @Body('roomLabel') roomLabel: string,
    @Body('capturedAt') capturedAt: string,
    @Body('sessionId') sessionId?: string,
    @Body('itemId') itemId?: string,
    @Body('itemName') itemName?: string,
    @Body('mediaType') mediaType?: 'BEFORE' | 'AFTER' | 'GENERAL',
  ) {
    if (!file) throw new BadRequestException('file이 필요합니다.');
    if (!hotelName || !roomLabel) {
      throw new BadRequestException('hotelName, roomLabel은 필수입니다.');
    }
    return this.mediaService.saveWithWatermark(file.buffer, {
      hotelName,
      roomLabel,
      capturedAt: capturedAt ?? new Date().toISOString(),
      sessionId,
      itemId,
      itemName,
      mediaType,
      mimetype: file.mimetype,
    });
  }

  // 관리자 웹 "객실 타임라인" Before/After 슬라이더 + Quick-Draw 마킹 도구용 조회
  @Get()
  listByRoom(@Query('hotelName') hotelName: string, @Query('roomLabel') roomLabel: string) {
    if (!hotelName || !roomLabel) {
      throw new BadRequestException('hotelName, roomLabel 쿼리 파라미터가 필요합니다.');
    }
    return this.mediaStore.listByRoom(hotelName, roomLabel);
  }
}
