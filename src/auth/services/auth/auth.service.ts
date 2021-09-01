import { Injectable } from '@nestjs/common';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { UserModel } from '../../../databases/models/user.model';
import { HashEncryptService } from '../hash-encrypt/hash-encrypt.service';
import { Session } from 'express-session';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenRepoService } from '../oauth/access-token-repo/access-token-repo.service';
import { RefreshTokenRepoService } from '../oauth/refresh-token-repo/refresh-token-repo.service';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepoService,
    private hashEncryptService: HashEncryptService,
    private accessTokenRepo: AccessTokenRepoService,
    private jwtService: JwtService,
    private refreshTokenRepo: RefreshTokenRepoService,
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

    if (!(await this.hashEncryptService.checkHash(password, user.password))) {
      return null;
    }

    return user;
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

  /**
   * Finds user by token
   * @param bearerToken
   */
  public async findUserByToken(bearerToken: string): Promise<UserModel | null> {
    let decodedId;
    try {
      decodedId = this.jwtService.decode(bearerToken) as string;
    } catch (err) {
      // @Todo
    }

    const accessToken = await this.accessTokenRepo.findForActiveState(
      decodedId,
    );
    if (accessToken === null) {
      return null;
    }

    if (accessToken.user_id === null) {
      return null;
    }

    return this.getLoggedInUser(accessToken.user_id);
  }

  /**
   * Find refresh token from encrypted token
   * @param token
   */
  public async findRefreshToken(
    token: string,
  ): Promise<RefreshTokenModel | null> {
    let decodedId;
    try {
      decodedId = this.jwtService.decode(token);
    } catch {
      // @Todo handle decoding error
    }

    return this.refreshTokenRepo.find(decodedId);
  }
}
