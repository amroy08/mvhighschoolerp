import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ipAddress, userAgent);

    // Set refresh token as HTTP-only cookie
    const isSecure = this.config.get('auth.cookieSecure', false);
    const cookieDomain = this.config.get('auth.cookieDomain', 'localhost');

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      domain: cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: 'Login successful',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke session' })
  async logout(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id, req.ip);

    const cookieDomain = this.config.get('auth.cookieDomain', 'localhost');
    res.clearCookie('refresh_token', { domain: cookieDomain, path: '/api/v1/auth' });

    return { success: true, data: null, message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'] as string;
    const result = await this.authService.refreshTokens(refreshToken);

    const isSecure = this.config.get('auth.cookieSecure', false);
    const cookieDomain = this.config.get('auth.cookieDomain', 'localhost');

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      domain: cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return { success: true, data: { accessToken: result.accessToken }, message: 'Token refreshed' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: unknown) {
    return { success: true, data: user };
  }
}
