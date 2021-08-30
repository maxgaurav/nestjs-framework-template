import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginAccessTokenGuard } from '../../guards/login-access-token/login-access-token.guard';
import { Request } from 'express';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';

@Controller('oauth')
export class OauthController {
  constructor(private clientRepo: ClientRepoService) {}

  @UseGuards(LoginAccessTokenGuard)
  @Post('token')
  public login(@Req() request: Request) {
    // @todo generate token information
    return request.user;
  }

  @Get('test')
  public test() {
    return this.clientRepo.generateClient('name');
  }
}
