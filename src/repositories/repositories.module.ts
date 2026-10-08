import { Module, Global } from '@nestjs/common';
import { UserRepository } from './user/user.repository';

@Global()
@Module({
  providers: [UserRepository],
  exports: [UserRepository],
})
export class RepositoriesModule {}
