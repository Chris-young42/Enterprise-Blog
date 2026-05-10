import { PartialType } from '@nestjs/swagger';
import { CreateMomentDto } from './create-moment.dto';

export class UpdateMomentDto extends PartialType(CreateMomentDto) {}
