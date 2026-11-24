import { INestApplication } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { faker } from '@faker-js/faker';
import { ClientModel } from '../../src/databases/models/oauth/client.model';
import { ClientRepoService } from '../../src/auth/services/oauth/client-repo/client-repo.service';
import { GrantTypes } from '../../src/auth/grant-types/grant-type-implementation';

/**
 * Creates an OAuth client through the app's own repository (random secret).
 * Inside `managedTransaction` the insert joins the test transaction through cls-hooked.
 */
export const clientFactory = (
  app: INestApplication,
  grantType: GrantTypes = GrantTypes.ImplicitPassword,
  transaction?: Transaction,
): Promise<ClientModel> =>
  app
    .get(ClientRepoService)
    .create(faker.company.name(), grantType, transaction);
