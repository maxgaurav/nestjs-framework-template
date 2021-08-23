import { Controller, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserModel } from '../../../databases/models/user.model';
import { LoginWebGuard } from '../../guards/login-web/login-web.guard';
import { Session } from 'express-session';

@Controller('auth/login')
export class LoginController {
  @Redirect('/profile')
  @UseGuards(LoginWebGuard)
  @Post()
  public login(@Req() request: Request) {
    (
      request.session as Session & {
        auth?: { isAuth: boolean; userId: number | null };
      }
    ).auth = {
      isAuth: true,
      userId: (request.user as UserModel).id,
    };
  }
}
