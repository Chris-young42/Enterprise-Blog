import { Module } from '@nestjs/common';
import { SensitiveWordsController } from './sensitive-words.controller';
import { SensitiveWordsService } from './sensitive-words.service';

@Module({
  controllers: [SensitiveWordsController],
  providers: [SensitiveWordsService],
  exports: [SensitiveWordsService],
})
export class SensitiveWordsModule {}