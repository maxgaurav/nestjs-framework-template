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
        defaultValue: DataType.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataType.BIGINT.UNSIGNED,
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
        defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP()'),
      },
      updated_at: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP()'),
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
