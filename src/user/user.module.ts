import { Module } from '@nestjs/common';
import { UserRepoService } from './services/user-repo/user-repo.service';

@Module({
  imports: [],
  providers: [UserRepoService],
  exports: [UserRepoService],
})
export class UserModule {}
