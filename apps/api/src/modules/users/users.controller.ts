import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { UsersService } from './users.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('me')
  getMyProfile(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) {
      return null
    }
    return this.usersService.getProfile(user.sub)
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: UpdateProfileDto,
  ) {
    if (!user) {
      return null
    }
    return this.usersService.updateProfile(user.sub, dto)
  }

  @Public()
  @Get(':id')
  getUserProfile(@CurrentUser() viewer: AuthenticatedUser | null, @Param('id') id: string) {
    return this.usersService.getPublicProfile(viewer?.sub ?? null, id)
  }

  @Public()
  @Get(':id/followers')
  getFollowers(@CurrentUser() viewer: AuthenticatedUser | null, @Param('id') id: string) {
    return this.usersService.listFollowers(viewer?.sub ?? null, id)
  }

  @Public()
  @Get(':id/following')
  getFollowing(@CurrentUser() viewer: AuthenticatedUser | null, @Param('id') id: string) {
    return this.usersService.listFollowing(viewer?.sub ?? null, id)
  }

  @Post(':id/follow')
  follow(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    if (!user) {
      return null
    }
    return this.usersService.follow(user.sub, id)
  }

  @Delete(':id/follow')
  unfollow(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    if (!user) {
      return null
    }
    return this.usersService.unfollow(user.sub, id)
  }
}
