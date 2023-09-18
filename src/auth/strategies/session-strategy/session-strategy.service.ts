import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../services/auth/auth.service';
import { UserModel } from '../../../databases/models/user.model';
import { LoginPasswordDto } from '../../dtos/login-password.dto';
import { validateOrReject } from 'class-validator';

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
    const dto = await this.validateContent(email, password);
    const user = await this.authService.validateForPassword(
      dto.email,
      dto.password,
    );
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  public async validateContent(
    email: string,
    password: string,
  ): Promise<LoginPasswordDto> {
    const dto = new LoginPasswordDto({ email, password });

    try {
      await validateOrReject(dto);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

    return dto;
  }
}
