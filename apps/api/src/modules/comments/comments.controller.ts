import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { ReviewCommentDto } from './dto/review-comment.dto';
import { UpdateCommentPolicyDto } from './dto/update-comment-policy.dto';

type AuthRequest = {
  ip?: string;
  user?: {
    sub: string;
    username: string;
    roleCodes: string[];
  };
};

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('comments/policy')
  getPublicPolicy() {
    return this.commentsService.getPublicPolicy();
  }

  @Public()
  @Get('comments/captcha')
  getCaptcha() {
    return this.commentsService.getCaptchaChallenge();
  }

  @Public()
  @Get('articles/:articleId/comments')
  listArticleComments(
    @Req() req: AuthRequest,
    @Param('articleId') articleId: string,
    @Query() query: ListCommentsDto,
  ) {
    return this.commentsService.list(articleId, query, req.user?.sub);
  }

  @Public()
  @Post('articles/:articleId/comments')
  createArticleComment(
    @Req() req: AuthRequest,
    @Param('articleId') articleId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user ?? null, articleId, dto, buildContext(req.ip));
  }

  @Public()
  @Post('comments/:id/like')
  likeComment(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.commentsService.react(id, 'LIKE', req.user ?? null, buildContext(req.ip));
  }

  @Public()
  @Post('comments/:id/dislike')
  dislikeComment(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.commentsService.react(id, 'DISLIKE', req.user ?? null, buildContext(req.ip));
  }

  @Public()
  @Post('comments/:id/report')
  reportComment(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.commentsService.react(id, 'REPORT', req.user ?? null, buildContext(req.ip));
  }

  @Get('admin/comments/pending')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listPending(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedPageSize = pageSize ? Number(pageSize) : 20;
    return this.commentsService.listPending(
      Number.isNaN(parsedPage) ? 1 : parsedPage,
      Number.isNaN(parsedPageSize) ? 20 : parsedPageSize,
    );
  }

  @Patch('admin/comments/:id/review')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  reviewComment(@Param('id') id: string, @Body() dto: ReviewCommentDto) {
    return this.commentsService.review(id, dto);
  }

  @Get('admin/comments/policy')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  getPolicy() {
    return this.commentsService.getPolicy();
  }

  @Get('admin/comments/blocked-users')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listBlockedUsers() {
    return this.commentsService.listBlockedUsers();
  }

  @Post('admin/comments/blocked-users/:userId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  blockUser(@Param('userId') userId: string) {
    return this.commentsService.blockUser(userId);
  }

  @Post('admin/comments/blocked-users/:userId/unblock')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  unblockUser(@Param('userId') userId: string) {
    return this.commentsService.unblockUser(userId);
  }

  @Patch('admin/comments/policy')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  updatePolicy(@Body() dto: UpdateCommentPolicyDto) {
    return this.commentsService.updatePolicy(dto);
  }
}

function buildContext(ip?: string) {
  return ip ? { ip } : {};
}
