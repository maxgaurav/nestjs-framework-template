import { Module } from '@nestjs/common';
import { UserRepoService } from './services/user-repo/user-repo.service';
import { ModelBootstrapModule } from '../databases/model-bootstrap/model-bootstrap.module';

@Module({
  imports: [ModelBootstrapModule.register()],
  providers: [UserRepoService],
})
export class UserModule {}
