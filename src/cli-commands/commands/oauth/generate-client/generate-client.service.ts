import { Injectable, Logger } from '@nestjs/common';
import { Command, Positional } from 'nestjs-command';
import { ClientRepoService } from '../../../../auth/services/oauth/client-repo/client-repo.service';
import { $enum } from 'ts-enum-util';
import { GrantTypes } from '../../../../auth/grant-types/grant-type-implementation';
import { UseCls } from 'nestjs-cls';

@Injectable()
export class GenerateClientService {
  constructor(
    private readonly clientRepo: ClientRepoService,
    private logger: Logger,
  ) {}

  @UseCls<[...args: any[]]>({
    generateId: true,
    idGenerator: () => crypto.randomUUID(),
    setup: (cls) => cls.set('type', 'COMMAND'),
  })
  @Command({
    command: 'oauth:generate-client <name> <grantType>',
    describe: 'Generate a new client id and secret',
  })
  public async generateClient(
    @Positional({
      name: 'name',
      type: 'string',
      description: 'Name of the client',
    })
    name: string,
    @Positional({
      name: 'grantType',
      type: 'string',
      description: 'Type of the client',
      choices: Array.from($enum(GrantTypes).values()),
    })
    grantType: GrantTypes,
  ) {
    this.logger.debug('Generating client', 'CliCommandModule');
    this.logger.debug(`Name provided: ${name}`, 'CliCommandModule');
    this.logger.debug(`Grant Type provided: ${grantType}`, 'CliCommandModule');
    const client = await this.clientRepo.create(name, grantType);
    this.logger.log(
      {
        clientId: client.id,
        clientSecret: client.secret,
        grantType: client.grant_type,
      },
      'Client',
    );
  }
}
