import { Module } from '@nestjs/common';
import { MessageBoardController } from './message-board.controller';
import { MessageBoardService } from './message-board.service';

@Module({
  controllers: [MessageBoardController],
  providers: [MessageBoardService],
  exports: [MessageBoardService],
})
export class MessageBoardModule {}
