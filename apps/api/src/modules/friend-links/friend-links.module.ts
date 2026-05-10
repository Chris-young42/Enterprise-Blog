import { Module } from '@nestjs/common';
import { FriendLinksController } from './friend-links.controller';
import { FriendLinksService } from './friend-links.service';

@Module({
  controllers: [FriendLinksController],
  providers: [FriendLinksService],
  exports: [FriendLinksService],
})
export class FriendLinksModule {}
