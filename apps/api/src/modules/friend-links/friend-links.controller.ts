import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FriendLinksService } from './friend-links.service';
import { CreateFriendLinkDto } from './dto/create-friend-link.dto';
import { UpdateFriendLinkDto } from './dto/update-friend-link.dto';
import { ReviewFriendLinkDto } from './dto/review-friend-link.dto';
import { BatchReviewFriendLinksDto } from './dto/batch-review-friend-links.dto';
import { ReorderFriendLinksDto } from './dto/reorder-friend-links.dto';

@Controller('friend-links')
export class FriendLinksController {
  constructor(private readonly friendLinksService: FriendLinksService) {}

  @Public()
  @Get()
  listPublic() {
    return this.friendLinksService.listPublic();
  }

  @Public()
  @Post('apply')
  apply(@Body() dto: CreateFriendLinkDto) {
    return this.friendLinksService.apply(dto);
  }

  @Get('admin/list')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listAdmin() {
    return this.friendLinksService.listAdmin();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  create(@Body() dto: CreateFriendLinkDto) {
    return this.friendLinksService.createAdmin(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() dto: UpdateFriendLinkDto) {
    return this.friendLinksService.update(id, dto);
  }

  @Patch('admin/:id/review')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  review(@Param('id') id: string, @Body() dto: ReviewFriendLinkDto) {
    return this.friendLinksService.review(id, dto);
  }

  @Patch('admin/batch/review')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  batchReview(@Body() dto: BatchReviewFriendLinksDto) {
    return this.friendLinksService.batchReview(dto);
  }

  @Patch('admin/reorder')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  reorder(@Body() dto: ReorderFriendLinksDto) {
    return this.friendLinksService.reorder(dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.friendLinksService.remove(id);
  }
}
