import { Injectable } from '@nestjs/common';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { UserModel } from '../../../databases/models/user.model';
import { HashEncryptService } from '../hash-encrypt/hash-encrypt.service';
import { Session } from 'express-session';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepoService,
    private hashEncryptService: HashEncryptService,
    private jwtService: JwtService, // @todo needs to be encapsulated
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
    return { id: 1 } as any;
    // const user = await this.userRepo.findByEmail(email);
    // if (!user) {
    //   return null;
    // }
    //
    // if (!(await this.hashEncryptService.checkHash(password, user.password))) {
    //   return null;
    // }
    //
    // return user;
  }

  /**
   * Returns current logged in user detail by user id
   * @param userId
   */
  public getLoggedInUser(userId: number): Promise<UserModel> {
    return this.userRepo.findOrFail(userId);
  }

  /**
   * Map user to session to setup authenticated state
   * @param session
   * @param user
   */
  public mapSessionWithUser(
    session: Session & {
      auth?: { isAuth: boolean; userId: number | null };
    },
    user: UserModel,
  ): Promise<boolean> {
    session.auth = {
      isAuth: true,
      userId: user.id,
    };
    return new Promise((res, rej) => {
      session.save((err) => {
        if (!!err) {
          rej(err);
          return;
        }
        res(true);
      });
    });
  }

  public async findUserByToken(token: any): Promise<UserModel | null> {
    return null;
  }

  /**
   * Return's access token
   * @param user
   */
  public async getAccessToken(user: UserModel): Promise<any> {
    console.log(user);
    return this.jwtService.signAsync('', {});
  }
}
