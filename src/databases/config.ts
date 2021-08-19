import { databaseConfig } from '../environment/configs/databases';

module.exports = {
  development: databaseConfig().databases.default,
  test: databaseConfig().databases.default,
  production: databaseConfig().databases.default,
};
