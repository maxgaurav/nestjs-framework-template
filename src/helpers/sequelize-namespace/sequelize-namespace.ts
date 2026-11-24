import { createNamespace, getNamespace, type Namespace } from 'cls-hooked';
import { Sequelize } from 'sequelize';

export const SequelizeNamespaceName = 'sequelize-cls-hooks';

/**
 * The one cls-hooked namespace Sequelize uses to find the active transaction.
 * Queries run inside an active managed transaction join it automatically.
 */
export const sequelizeNamespace: Namespace =
  getNamespace(SequelizeNamespaceName) ??
  createNamespace(SequelizeNamespaceName);

/**
 * Binds Sequelize to {@link sequelizeNamespace}. Must run before any Sequelize
 * instance is created, so call it at the top of every entry point
 * (app, CLI, REPL, e2e setup).
 */
export const registerSequelizeCls = (): void => {
  Sequelize.useCLS(sequelizeNamespace);
};
