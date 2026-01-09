import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { RefreshTokenDto } from '../../../dtos/refresh-token.dto';
import { validateOrReject } from 'class-validator';
import { AuthService } from '../../../services/auth/auth.service';
import moment from 'moment';
import { ClientRepoService } from '../../../services/oauth/client-repo/client-repo.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RefreshTokenService extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly clientRepo: ClientRepoService,
  ) {
    super();
  }

  public async validate(request: Request): Promise<RefreshTokenModel> {
    // aborting with 404 as accept content is not correct
    if (!request.headers.accept?.toLowerCase().includes('application/json')) {
      throw new NotFoundException();
    }

    const payload = await this.validateContent(request.body, RefreshTokenDto);

    const client = await this.clientRepo.findForIdAndSecret(
      payload.client_id,
      payload.client_secret,
    );
    if (!client) {
      const errors: ValidationError[] = [
        {
          property: 'credentials',
          constraints: {
            credentials: 'Client credentials are invalid',
          },
          children: [],
        },
      ];
      throw new UnprocessableEntityException(errors);
    }

    const refreshToken = await this.authService.findRefreshToken(
      payload.refresh_token,
    );

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    if (
      !!refreshToken.expires_at &&
      moment().isAfter(moment(refreshToken.expires_at))
    ) {
      throw new UnauthorizedException();
    }

    return refreshToken;
  }

  /**
   * Validate the body content
   * @param body
   * @param dtoInstance
   */
  public async validateContent(
    body: { [key: string]: any },
    dtoInstance: { new (content: any): RefreshTokenDto },
  ): Promise<RefreshTokenDto> {
    const payload = plainToInstance(dtoInstance, body, {
      exposeDefaultValues: true,
      exposeUnsetFields: true,
    });
    try {
      await validateOrReject(payload);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

    return payload;
  }
}
