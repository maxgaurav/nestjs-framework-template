import { Injectable } from '@nestjs/common';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { UserModel } from '../../../databases/models/user.model';
import { HashEncryptService } from '../hash-encrypt/hash-encrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepoService,
    private hashEncryptService: HashEncryptService,
  ) {}

  /**
   * Authenticate against user's password and email
   * @param email
   * @param password
   */
  public async validateForPassword(
    email: string,
    password: string,
  ): Promise<UserModel | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return null;
    }

    if (!this.hashEncryptService.checkHash(password, user.password)) {
      return null;
    }

    return user;
  }

  public getLoggedInUser(userId: number): Promise<UserModel> {
    return this.userRepo.findByIdOrFail(userId);
  }
}
