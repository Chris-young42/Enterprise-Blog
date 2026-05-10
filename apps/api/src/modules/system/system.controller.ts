import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('system')
@Public()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('meta')
  getMeta() {
    return this.systemService.getSystemMeta();
  }
}
