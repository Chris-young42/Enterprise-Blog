import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  list() {
    return this.seriesService.list();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  create(@Body() dto: CreateSeriesDto) {
    return this.seriesService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() dto: UpdateSeriesDto) {
    return this.seriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.seriesService.remove(id);
  }
}
