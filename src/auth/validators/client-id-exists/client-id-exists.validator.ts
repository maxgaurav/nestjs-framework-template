import { Injectable } from '@nestjs/common';
import {
  type ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidatorDecorator } from '../../../helpers/base-validator/base-validator';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';
import { GrantTypes } from '../../grant-types/grant-type-implementation';

@ValidatorConstraint({ async: true, name: 'ClientIdExists' })
@Injectable()
export class ClientIdExistsValidator implements ValidatorConstraintInterface {
  constructor(protected clientRepo: ClientRepoService) {}

  /**
   * @inheritDoc
   * @param value
   * @param validationArguments
   */
  @LoggingDecorator({
    messageBefore: 'Checking if client id is valid',
  })
  public async validate(
    value: string | null | undefined,
    validationArguments: ValidationArguments,
  ): Promise<boolean> {
    if (!value) {
      return true;
    }

    const grantType: GrantTypes | undefined | null = (
      validationArguments.object as never as {
        grant_type: GrantTypes | undefined | null;
      }
    ).grant_type;

    if (!grantType) {
      return true;
    }

    return this.clientRepo
      .find(value)
      .then(
        (result) =>
          !!result && !result.is_revoked && result.grant_type === grantType,
      );
  }

  defaultMessage(): string {
    return 'The client id is not valid';
  }
}

export const ClientIdExists = ValidatorDecorator(ClientIdExistsValidator);
