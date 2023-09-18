import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint } from 'class-validator';
import {
  BaseValidator,
  ValidatorDecorator,
} from '../../../helpers/base-validator/base-validator';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';
import { GrantTypes } from '../../grant-types/grant-type-implementation';

@ValidatorConstraint({ async: true, name: 'ClientIdExists' })
@Injectable()
export class ClientIdExistsValidator extends BaseValidator {
  constructor(protected clientRepo: ClientRepoService) {
    super();
  }

  /**
   * @inheritDoc
   * @param value
   * @param validationArguments
   */
  @LoggingDecorator({
    messageBefore: 'Checking if client id is valid',
  })
  public async check(
    value: string | null | undefined,
    validationArguments: ValidationArguments,
  ): Promise<boolean> {
    if (!value) {
      return true;
    }

    const grantType: GrantTypes | undefined | null = (
      validationArguments.object as any
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

  message(): string {
    return 'The client id is not valid';
  }
}

export const ClientIdExists = ValidatorDecorator(ClientIdExistsValidator);
