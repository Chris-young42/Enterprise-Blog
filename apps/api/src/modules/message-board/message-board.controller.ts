import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MessageBoardService } from './message-board.service';
import { CreateMessageBoardDto } from './dto/create-message-board.dto';
import { ReviewMessageBoardDto } from './dto/review-message-board.dto';
import { BatchReviewMessageBoardDto } from './dto/batch-review-message-board.dto';
import { BatchRemoveMessageBoardDto } from './dto/batch-remove-message-board.dto';
import { ListMessageBoardDto } from './dto/list-message-board.dto';

type AuthRequest = {
  user?: {
    sub: string;
  };
};

@Controller('message-board')
export class MessageBoardController {
  constructor(private readonly messageBoardService: MessageBoardService) {}

  @Public()
  @Get()
  listPublic(@Query() query: ListMessageBoardDto) {
    return this.messageBoardService.listPublic(query);
  }

  @Public()
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateMessageBoardDto) {
    return this.messageBoardService.create(req.user ?? null, dto);
  }

  @Get('admin/list')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listAdmin(@Query() query: ListMessageBoardDto) {
    return this.messageBoardService.listAdmin(query);
  }

  @Patch('admin/:id/review')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  review(@Param('id') id: string, @Body() dto: ReviewMessageBoardDto) {
    return this.messageBoardService.review(id, dto);
  }

  @Patch('admin/batch/review')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  batchReview(@Body() dto: BatchReviewMessageBoardDto) {
    return this.messageBoardService.batchReview(dto);
  }

  @Delete('admin/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.messageBoardService.remove(id);
  }

  @Patch('admin/batch/remove')
  @Roles('SUPER_ADMIN', 'ADMIN')
  batchRemove(@Body() dto: BatchRemoveMessageBoardDto) {
    return this.messageBoardService.batchRemove(dto);
  }
}
