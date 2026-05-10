import { Module } from '@nestjs/common';
import { MessageBoardController } from './message-board.controller';
import { MessageBoardService } from './message-board.service';
import { SensitiveWordsModule } from '../sensitive-words/sensitive-words.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [SensitiveWordsModule, SecurityModule],
  controllers: [MessageBoardController],
  providers: [MessageBoardService],
  exports: [MessageBoardService],
})
export class MessageBoardModule {}
