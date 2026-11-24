import { Module, Global } from '@nestjs/common';
import { UserRepository } from './user/user.repository.js';

@Global()
@Module({
  providers: [UserRepository],
  exports: [UserRepository],
})
export class RepositoriesModule {}
