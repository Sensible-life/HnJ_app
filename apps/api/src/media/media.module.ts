import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { MediaStore } from './media.store.js';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaStore],
  exports: [MediaStore],
})
export class MediaModule {}
