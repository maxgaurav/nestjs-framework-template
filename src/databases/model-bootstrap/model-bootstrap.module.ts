import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from '../models/user.model';
import { ClientModel } from '../models/oauth/client.model';
import { AccessTokenModel } from '../models/oauth/access-token.model';
import { RefreshTokenModel } from '../models/oauth/refresh-token.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      ClientModel,
      AccessTokenModel,
      RefreshTokenModel,
    ]),
  ],
})
export class ModelBootstrapModule {
  static register() {
    return SequelizeModule.forFeature([
      UserModel,
      ClientModel,
      AccessTokenModel,
      RefreshTokenModel,
    ]);
  }
}
