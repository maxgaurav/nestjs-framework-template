'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { DataType } from 'sequelize-typescript';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('oauth_clients', {
      id: {
        type: DataType.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal(`uuid_generate_v4()`),
      },
      name: {
        type: DataType.STRING,
        allowNull: false,
      },
      secret: {
        type: DataType.STRING(100),
        allowNull: false,
      },
      is_revoked: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      grant_type: {
        type: DataType.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: Sequelize.Sequelize.literal('now()'),
      },
      updated_at: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: Sequelize.Sequelize.literal('now()'),
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('oauth_clients');
  },
};
