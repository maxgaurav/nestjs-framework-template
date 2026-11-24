import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model.js';
import { UserModel } from '../../../databases/models/user.model.js';
import { ClientModel } from '../../../databases/models/oauth/client.model.js';
import { Transaction } from 'sequelize';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator.js';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service.js';
import { createHash } from 'node:crypto';
import { Buffer } from 'buffer';

@Injectable()
export class AuthorizationChallengeRepoService {
  constructor(
    @InjectModel(AuthorizationChallengeModel)
    public authorizationChallengeModel: typeof AuthorizationChallengeModel,
    protected transactionProvider: TransactionProviderService,
  ) {}

  /**
   * Creates authorization challenge record
   * @param user
   * @param client
   * @param data
   * @param transaction
   */
  @LoggingDecorator({
    messageBefore: 'Creating authorization challenge record',
  })
  public createWithPkceCodeChallenge(
    user: UserModel | number,
    client: ClientModel | string,
    data: Pick<AuthorizationChallengeModel, 'challenge' | 'algorithm'>,
    transaction?: Transaction,
  ): Promise<AuthorizationChallengeModel> {
    return this.authorizationChallengeModel
      .build()
      .setAttributes({
        user_id: typeof user === 'number' ? user : user.id,
        client_id: typeof client === 'string' ? client : client.id,
        ...data,
      })
      .save({ transaction });
  }

  /**
   * Verify the challenge for code with verifier
   * @param code
   * @param codeVerifier
   */
  @LoggingDecorator({
    messageBefore:
      'Validating challenge stored against code with verifier and returning challenge record if passed',
  })
  public async verifyChallenge(
    code: string,
    codeVerifier: string,
  ): Promise<AuthorizationChallengeModel | false> {
    const result = await this.consumeCode(code);
    if (!result) {
      return false;
    }

    return this.compareChallengeAndVerifier(
      result.challenge,
      codeVerifier,
      result.algorithm,
    )
      ? result
      : false;
  }

  public compareChallengeAndVerifier(
    challenge: string,
    verifier: string,
    algorithm: string,
  ): boolean {
    const challengeBuf = Buffer.from(
      challenge.replace(/-/g, '+').replace(/_/g, '/') +
        '=='.slice((challenge.length + 2) % 4),
      'base64',
    );

    // 2. Hash *raw* UTF-8 verifier; do NOT decode
    const hash = createHash(algorithm)
      .update(verifier) // no encoding! raw UTF-8
      .digest();

    return Buffer.compare(challengeBuf, hash) === 0;
  }

  @LoggingDecorator({
    messageBefore:
      'Finding record for code and consuming the challenge record if found by deleting it',
  })
  private async consumeCode(
    code: string,
  ): Promise<AuthorizationChallengeModel | null> {
    return this.transactionProvider.createManaged<AuthorizationChallengeModel | null>(
      async (transaction) => {
        // Unknown or already used (consumed) codes are an invalid grant, not an error
        const challengeRecord = await this.authorizationChallengeModel.findByPk(
          code,
          { transaction, include: [UserModel, ClientModel] },
        );
        await challengeRecord?.destroy({ transaction });
        return challengeRecord;
      },
    );
  }

  /**
   * Creates authorization challenge for authorization grant type
   * @param user
   * @param client
   * @param transaction
   */
  public createForAuthorizationCode(
    user: UserModel | number,
    client: ClientModel | string,
    transaction?: Transaction,
  ): Promise<AuthorizationChallengeModel> {
    return this.authorizationChallengeModel
      .build()
      .setAttributes({
        user_id: typeof user === 'number' ? user : user.id,
        client_id: typeof client === 'string' ? client : client.id,
        challenge: '',
        algorithm: '',
      })
      .save({ transaction });
  }

  /**
   * Verifies code with client id provided
   * @param code
   * @param clientId
   */
  @LoggingDecorator({
    messageBefore:
      "Verifying the code's client id with client id provided in as input",
  })
  public async verifyWithClientId(
    code: string,
    clientId: string,
  ): Promise<AuthorizationChallengeModel | false> {
    const result = await this.consumeCode(code);
    return result && result.client_id === clientId ? result : false;
  }
}
