import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaStorageAdapter } from './storage.adapter';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaStorageAdapter],
  exports: [MediaService],
})
export class MediaModule {}
