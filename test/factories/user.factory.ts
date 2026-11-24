import { INestApplication } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { getModelToken } from '@nestjs/sequelize';
import { faker } from '@faker-js/faker';
import { UserModel } from '../../src/databases/models/user.model.js';
import { HashEncryptService } from '../../src/auth/services/hash-encrypt/hash-encrypt.service.js';

/**
 * Creates a user. Inside `managedTransaction` the insert joins the test transaction
 * through cls-hooked, so `transaction` is only needed outside that scope.
 *
 * A plain `password` is hashed the same way the app hashes it.
 */
export const userFactory = async (
  app: INestApplication,
  overwrite: Partial<Pick<UserModel, 'email' | 'password'>> = {},
  transaction?: Transaction,
): Promise<UserModel> => {
  const password = overwrite.password
    ? await app.get(HashEncryptService).createHash(overwrite.password)
    : null;

  return app
    .get<typeof UserModel>(getModelToken(UserModel))
    .build()
    .setAttributes({ email: faker.internet.email().toLowerCase() })
    .setAttributes({ ...overwrite, password })
    .save({ transaction });
};
