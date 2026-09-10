import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service.js';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('hotelName') hotelName: string,
    @Body('roomLabel') roomLabel: string,
    @Body('capturedAt') capturedAt: string,
  ) {
    if (!file) throw new BadRequestException('file이 필요합니다.');
    if (!hotelName || !roomLabel) {
      throw new BadRequestException('hotelName, roomLabel은 필수입니다.');
    }
    return this.mediaService.saveWithWatermark(file.buffer, {
      hotelName,
      roomLabel,
      capturedAt: capturedAt ?? new Date().toISOString(),
    });
  }
}
