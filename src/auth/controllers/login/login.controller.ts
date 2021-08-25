import { Controller, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserModel } from '../../../databases/models/user.model';
import { LoginWebGuard } from '../../guards/login-web/login-web.guard';
import { AuthService } from '../../services/auth/auth.service';

@Controller('auth/login')
export class LoginController {
  constructor(private authService: AuthService) {}

  @Redirect('/profile')
  @UseGuards(LoginWebGuard)
  @Post()
  public login(@Req() request: Request) {
    this.authService.mapSessionWithUser(
      request.session as any,
      request.user as UserModel,
    );
    return request.user;
  }
}
