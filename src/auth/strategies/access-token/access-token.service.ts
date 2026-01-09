import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import { AccessTokenDto } from '../../dtos/access-token.dto';
import { validateOrReject } from 'class-validator';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';
import {
  GrantTypeImplementationInstance,
  GrantTypes,
} from '../../grant-types/grant-type-implementation';
import { ImplicitPasswordGrantType } from '../../grant-types/implicit-password/implicit-password.grant-type';
import { ModuleRef } from '@nestjs/core';
import { ProofKeyExchangeGrantType } from '../../grant-types/proof-key-exchage/proof-key-exchange.grant-type';
import { AuthorizationCodeGrantType } from '../../grant-types/authorization-code/authorization-code.grant-type';
import { plainToInstance } from 'class-transformer';

const GrantTypeMappings: Record<GrantTypes, GrantTypeImplementationInstance> = {
  [GrantTypes.ImplicitPassword]: ImplicitPasswordGrantType,
  [GrantTypes.PKCE]: ProofKeyExchangeGrantType,
  [GrantTypes.AuthorizationCode]: AuthorizationCodeGrantType,
};

@Injectable()
export class AccessTokenService extends PassportStrategy(
  Strategy,
  'accessToken',
) {
  constructor(protected readonly moduleRef: ModuleRef) {
    super();
  }

  /**
   * Main validation action
   * @param request
   */
  @LoggingDecorator({
    messageBefore: 'Validating Access Token generation payload',
    messageAfter: 'Payload valid',
  })
  public async validate(
    request: Request,
  ): Promise<{ user: UserModel; client: ClientModel }> {
    // aborting with 404 as accept content is not correct
    if (!request.headers.accept?.toLowerCase().includes('application/json')) {
      throw new NotFoundException();
    }

    const payload = await this.validateContent(request.body, AccessTokenDto);

    if (!GrantTypeMappings[payload.grant_type]) {
      throw new Error(`Grant Type ${payload.grant_type} not implemented`);
    }

    return this.moduleRef
      .resolve(GrantTypeMappings[payload.grant_type])
      .then((instance) => instance.validate(payload));
  }

  /**
   * Validate content of body and return dto object
   * @param body
   * @param dtoInstance
   */
  public async validateContent(
    body: {
      [key: string]: any;
    },
    dtoInstance: { new (content: any): AccessTokenDto },
  ): Promise<AccessTokenDto> {
    const payload = plainToInstance(dtoInstance, body);
    try {
      await validateOrReject(payload);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

    return payload;
  }
}
