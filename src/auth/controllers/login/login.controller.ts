import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserModel } from '../../../databases/models/user.model';
import { LoginWebGuard } from '../../guards/login-web/login-web.guard';
import { AuthService } from '../../services/auth/auth.service';
import { IntendManagerService } from '../../../session-manager/services/intend-manager/intend-manager.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('auth')
export class LoginController {
  /**
   * Default redirect url
   * @protected
   */
  static DefaultRedirectUrl = '/profile';

  constructor(
    private authService: AuthService,
    private intendManager: IntendManagerService,
  ) {}

  @UseGuards(LoginWebGuard)
  @Post('login')
  public async login(@Req() request: Request, @Res() response: Response) {
    await this.authService.mapSessionWithUser(
      request.session as any,
      request.user as UserModel,
    );

    const redirectUrl = this.getRedirectUrl(request);
    return new Promise<void>((res, rej) => {
      request.session.save((err) => {
        if (!!err) {
          rej(err);
          return;
        }
        response.redirect(redirectUrl);
        res();
      });
    });
  }

  /**
   * Returns the redirect url
   * @param request
   */
  public getRedirectUrl(request: Request): string {
    const intendUrl = this.intendManager.getUrl(request);

    if (!!intendUrl) {
      this.intendManager.setUrl(request, null);
      return intendUrl;
    }

    return LoginController.DefaultRedirectUrl;
  }
}
