import { Injectable, Logger } from '@nestjs/common';
import { Command, Positional } from 'nestjs-command';
import { ClientRepoService } from '../../../../auth/services/oauth/client-repo/client-repo.service';

@Injectable()
export class GenerateClientService {
  constructor(
    private readonly clientRepo: ClientRepoService,
    private logger: Logger,
  ) {}

  @Command({
    command: 'oauth:generate-client',
    describe: 'Generate a new client id and secret',
  })
  public async generateClient(
    @Positional({
      name: 'name',
      type: 'string',
      description: 'Name of the client',
    })
    name: string,
  ) {
    this.logger.debug('Generating client', 'CliCommandModule');
    this.logger.debug(`Name provided: ${name}, 'CliCommandModule`);
    const client = await this.clientRepo.create(name);
    this.logger.log(
      { clientId: client.id, clientSecret: client.secret },
      'Client',
    );
  }
}
