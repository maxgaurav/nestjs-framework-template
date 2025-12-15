import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { Transaction } from 'sequelize';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service';
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
  private async consumeCode(code: string) {
    return await this.transactionProvider.createManaged<AuthorizationChallengeModel>(
      async (transaction) => {
        const challengeRecord = await this.authorizationChallengeModel.findByPk(
          code,
          {
            transaction,
            rejectOnEmpty: true,
            include: [UserModel, ClientModel],
          },
        );
        await challengeRecord.destroy({ transaction });
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
    return result.client.id === clientId ? result : false;
  }
}
