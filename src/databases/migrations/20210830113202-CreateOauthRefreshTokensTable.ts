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

    await queryInterface.createTable('oauth_refresh_tokens', {
      id: {
        type: DataType.STRING(100),
        primaryKey: true,
        allowNull: false,
      },
      expires_at: {
        type: DataType.DATE,
        allowNull: true,
        defaultValue: null,
      },
      access_token_id: {
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

    await queryInterface.addConstraint('oauth_refresh_tokens', {
      type: 'foreign key',
      references: {
        table: 'oauth_access_tokens',
        field: 'id',
      },
      fields: ['access_token_id'],
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    });

    await queryInterface.addIndex('oauth_refresh_tokens', ['access_token_id']);
  },

  down: async (queryInterface: QueryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('oauth_refresh_tokens');
  },
};
