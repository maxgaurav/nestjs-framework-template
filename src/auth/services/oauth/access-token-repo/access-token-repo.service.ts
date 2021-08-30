import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';

@Injectable()
export class AccessTokenRepoService {
  constructor(
    @InjectModel(AccessTokenModel) public accessToken: typeof AccessTokenModel,
    private randomByteGenerate: RandomByteGeneratorService,
  ) {}
}
