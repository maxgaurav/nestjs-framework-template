import { Controller, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserModel } from '../../../databases/models/user.model';
import { LoginWebGuard } from '../../guards/login-web/login-web.guard';

@Controller('auth/login')
export class LoginController {
  @Redirect('/profile')
  @UseGuards(LoginWebGuard)
  @Post()
  public async login(@Req() request: Request) {
    (request.session as any).auth = {
      isAuth: true,
      userId: (request.user as UserModel).id,
    };
  }
}
