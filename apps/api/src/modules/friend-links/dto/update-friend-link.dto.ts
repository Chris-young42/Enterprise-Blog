import { PartialType } from '@nestjs/swagger';
import { CreateFriendLinkDto } from './create-friend-link.dto';

export class UpdateFriendLinkDto extends PartialType(CreateFriendLinkDto) {}
