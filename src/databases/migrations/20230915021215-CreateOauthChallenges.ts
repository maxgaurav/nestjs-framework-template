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
    await queryInterface.createTable('oauth_authorization_challenges', {
      id: {
        type: DataType.UUID,
        defaultValue: Sequelize.literal(`uuid_generate_v4()`),
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataType.BIGINT,
        allowNull: false,
      },
      client_id: {
        type: DataType.UUID,
        allowNull: false,
      },
      challenge: {
        type: DataType.TEXT,
        allowNull: false,
      },
      algorithm: {
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

    await queryInterface.addConstraint('oauth_authorization_challenges', {
      type: 'foreign key',
      references: {
        field: 'id',
        table: 'users',
      },
      fields: ['user_id'],
      name: 'user_id_users_id_fk',
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    });

    await queryInterface.addIndex('oauth_authorization_challenges', [
      'user_id',
    ]);

    await queryInterface.addConstraint('oauth_authorization_challenges', {
      type: 'foreign key',
      references: {
        field: 'id',
        table: 'oauth_clients',
      },
      fields: ['client_id'],
      name: 'client_id_oauth_clients_id_fk',
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    });

    await queryInterface.addIndex('oauth_authorization_challenges', [
      'client_id',
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('oauth_authorization_challenges');
  },
};
