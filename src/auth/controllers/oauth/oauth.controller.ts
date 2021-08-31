import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginAccessTokenGuard } from '../../guards/login-access-token/login-access-token.guard';
import { Request } from 'express';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service';
import { AccessTokenGuard } from '../../guards/access-token/access-token.guard';

@Controller('oauth')
export class OauthController {
  constructor(private accessTokenRepo: AccessTokenRepoService) {}

  @UseGuards(LoginAccessTokenGuard)
  @Post('token')
  public async login(@Req() request: Request) {
    // @todo generate token information
    const accessToken = await this.accessTokenRepo.create(
      (request.user as any).client,
      (request.user as any).user,
    );
    return this.accessTokenRepo.createBearerToken(accessToken);
  }

  @UseGuards(AccessTokenGuard)
  @Get('test')
  public sample(@Req() request) {
    return request.user;
  }
}
