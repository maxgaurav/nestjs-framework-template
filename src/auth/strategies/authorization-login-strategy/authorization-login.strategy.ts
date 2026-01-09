import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { UserModel } from '../../../databases/models/user.model';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { AuthorizationDto } from '../../dtos/authorization.dto';
import type { Request } from 'express';
import { LoginDto } from '../../dtos/login.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AuthService } from '../../services/auth/auth.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable()
export class AuthorizationLoginStrategy extends PassportStrategy(
  Strategy,
  'oauthAuthorization',
) {
  constructor(
    protected hashEncrypt: HashEncryptService,
    protected auth: AuthService,
  ) {
    super();
  }

  /**
   * Validates the request content for oauth authorization login
   * @param request
   */
  @LoggingDecorator({
    messageBefore: 'Oauth2: Attempting to login user',
    messageAfter: 'Oauth2: Attempt successful found user',
  })
  public async validate(
    request: Request,
  ): Promise<{ user: UserModel; authorization: AuthorizationDto }> {
    request.body = request.body || {};
    request.body.token = await this.decryptToken(request.body);
    const loginCredentials = await this.validateContent(request.body);
    const user = await this.findUserForCredentials(loginCredentials);

    return { user, authorization: loginCredentials.token };
  }

  /**
   * Finding user with credentials provided
   * @param loginCredentials
   * @private
   * @throws
   */
  @LoggingDecorator({
    messageBefore:
      'Oauth2: Starting to look for user with credentials provided in payload',
    messageAfter: 'Oauth2: User with matching credentials found',
  })
  private async findUserForCredentials(loginCredentials: LoginDto) {
    const user = await this.auth.validateForPassword(
      loginCredentials.email,
      loginCredentials.password,
    );

    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  @LoggingDecorator({
    messageBefore:
      'Oauth2: Attempting to decrypt token information attached to login attempt',
  })
  public async decryptToken(
    body: any,
  ): Promise<NonNullable<unknown> & Partial<AuthorizationDto>> {
    if (typeof body.token !== 'string') {
      return {};
    }

    return this.hashEncrypt
      .decrypt(body.token)
      .then((result) => JSON.parse(result))
      .catch(() =>
        Promise.reject(
          new UnprocessableEntityException([
            {
              property: 'token',
              constraints: {
                credentials: 'Token is not valid',
              },
              children: [],
            },
          ]),
        ),
      );
  }

  @LoggingDecorator({
    messageBefore: 'Oauth2: Validating user credentials payload',
    messageAfter: 'Oauth2: UserCredentials payload valid',
  })
  public async validateContent(body: any): Promise<LoginDto> {
    const loginDto = plainToInstance(LoginDto, body);

    try {
      await validateOrReject(loginDto);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }
    return loginDto;
  }
}
