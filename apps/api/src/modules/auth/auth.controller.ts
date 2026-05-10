import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTrafficShield } from '../../common/decorators/skip-traffic-shield.decorator';

type AuthRequest = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Req() req: AuthRequest, @Body() dto: LoginDto) {
    const userAgentRaw = req.headers?.['user-agent'];
    const userAgent = Array.isArray(userAgentRaw) ? userAgentRaw[0] : userAgentRaw;
    return this.authService.login(dto, req.ip, userAgent);
  }

  @Public()
  @Get('captcha')
  @SkipTrafficShield()
  captcha() {
    return this.authService.createCaptcha();
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) {
      return null;
    }
    return this.authService.profile(user.sub);
  }
}
