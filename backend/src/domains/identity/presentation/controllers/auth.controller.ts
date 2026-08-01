import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../decorators/public.decorator';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { RegisterUseCase } from '@/domains/identity/application/use-cases/auth/register.use-case';
import { RefreshTokenUseCase } from '@/domains/identity/application/use-cases/auth/refresh-token.use-case';
import { LoginWithGoogleUseCase } from '@/domains/identity/application/use-cases/auth/login-with-google.use-case';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dtos/auth.dto';
import { ConfigService } from '@/config/config.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Public()
  @ResponseMessage('User registered successfully')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Req() req: any) {
    return req.user;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed successfully')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out successfully')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout() {
    return null;
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  googleAuth(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    if (req.authError) {
      this.logger.error(`Google OAuth init error: ${req.authError.message}`);
      const errorParams = new URLSearchParams({
        error: 'authentication_failed',
        message: req.authError.message ?? 'Failed to start Google authentication',
        success: 'false',
      });
      return res.redirect(
        `${this.configService.frontendCallbackUrl}?${errorParams.toString()}`,
      );
    }
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Res() res: Response) {
    const req = res.req as any;
    const frontendCallbackUrl = this.configService.frontendCallbackUrl;

    if (req.authError) {
      this.logger.error(`Google OAuth error: ${req.authError.message}`);
      const errorParams = new URLSearchParams({
        error: 'authentication_failed',
        message: req.authError.message ?? 'Authentication failed',
        success: 'false',
      });
      return res.redirect(`${frontendCallbackUrl}?${errorParams.toString()}`);
    }

    if (!req.user) {
      const errorParams = new URLSearchParams({
        error: 'no_user_data',
        message: 'No user data received from authentication provider',
        success: 'false',
      });
      return res.redirect(`${frontendCallbackUrl}?${errorParams.toString()}`);
    }

    try {
      const result = await this.loginWithGoogleUseCase.execute({
        email: req.user.email,
        name: req.user.name,
        picture: req.user.profilePicture,
        sub: req.user.providerId,
      });

      const tokens = result.tokens;
      const successParams = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        success: 'true',
      });
      return res.redirect(`${frontendCallbackUrl}?${successParams.toString()}`);
    } catch (error) {
      this.logger.error(`Google login error: ${error.message}`);
      const errorParams = new URLSearchParams({
        error: 'processing_error',
        message: error.message ?? 'Authentication processing failed',
        success: 'false',
      });
      return res.redirect(`${frontendCallbackUrl}?${errorParams.toString()}`);
    }
  }
}
