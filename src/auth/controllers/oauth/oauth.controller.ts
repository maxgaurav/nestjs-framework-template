import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LoginAccessTokenGuard } from '../../guards/login-access-token/login-access-token.guard';
import { Request } from 'express';

@Controller('oauth')
export class OauthController {
  @UseGuards(LoginAccessTokenGuard)
  @Post('token')
  public login(@Req() request: Request) {
    // @todo generate token information
    return request.user;
  }
}
