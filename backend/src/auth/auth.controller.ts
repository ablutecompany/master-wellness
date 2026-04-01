import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint de Login.
   * Recebe credenciais governadas e devolve token de sessão persistente.
   */
  @Post('login')
  async login(@Body() body: { email: string; passwordHash: string }) {
    return this.authService.login(body.email, body.passwordHash);
  }

  /**
   * Endpoint de validação de sessão em tempo real.
   */
  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header em falta ou inválido');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.validateSession(token);
  }
}
