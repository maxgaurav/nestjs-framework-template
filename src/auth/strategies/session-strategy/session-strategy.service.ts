import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../services/auth/auth.service';
import { UserModel } from '../../../databases/models/user.model';

@Injectable()
export class SessionStrategyService extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * Returns the user if authentication passes
   * @param email
   * @param password
   */
  public async validate(email: string, password: string): Promise<UserModel> {
    // @todo add dto for required content;
    const user = await this.authService.validateForPassword(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
