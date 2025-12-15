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
    await queryInterface.createTable('oauth_access_tokens', {
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
      client_id: {
        type: DataType.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataType.BIGINT,
        allowNull: true,
        defaultValue: null,
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

    await queryInterface.addConstraint('oauth_access_tokens', {
      type: 'foreign key',
      references: {
        table: 'oauth_clients',
        field: 'id',
      },
      fields: ['client_id'],
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    });

    await queryInterface.addIndex('oauth_access_tokens', ['client_id']);

    await queryInterface.addConstraint('oauth_access_tokens', {
      type: 'foreign key',
      references: {
        table: 'users',
        field: 'id',
      },
      fields: ['user_id'],
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    });

    await queryInterface.addIndex('oauth_access_tokens', ['user_id']);
  },

  down: async (queryInterface: QueryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('oauth_access_tokens');
  },
};
