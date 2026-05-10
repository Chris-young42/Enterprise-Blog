import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { SensitiveWordsService } from './sensitive-words.service';
import { CreateSensitiveWordDto } from './dto/create-sensitive-word.dto';
import { UpdateSensitiveWordDto } from './dto/update-sensitive-word.dto';

@Controller('sensitive-words')
export class SensitiveWordsController {
  constructor(private readonly sensitiveWordsService: SensitiveWordsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  list(@Query('keyword') keyword?: string, @Query('isEnabled') isEnabled?: string) {
    return this.sensitiveWordsService.list({
      ...(keyword ? { keyword } : {}),
      ...(isEnabled ? { isEnabled } : {}),
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  create(@Body() dto: CreateSensitiveWordDto) {
    return this.sensitiveWordsService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() dto: UpdateSensitiveWordDto) {
    return this.sensitiveWordsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.sensitiveWordsService.remove(id);
  }
}
