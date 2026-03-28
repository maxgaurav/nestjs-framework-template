import {
  Allow,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotIn,
  IsString,
  IsUrl,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { GrantTypes } from '../grant-types/grant-type-implementation';
import { ClientIdExists } from '../validators/client-id-exists/client-id-exists.validator';

export class AuthorizationDto {
  @IsNotEmpty()
  @IsEnum(GrantTypes)
  @IsNotIn([GrantTypes.ImplicitPassword])
  public grant_type: GrantTypes;

  @IsNotEmpty()
  @IsUUID()
  @ClientIdExists()
  public client_id: string;

  @ValidateIf((obj: AuthorizationDto) => obj?.grant_type === GrantTypes.PKCE)
  @IsNotEmpty()
  @IsString()
  public code_challenge: string | null = null;

  @ValidateIf((obj: AuthorizationDto) => obj?.grant_type === GrantTypes.PKCE)
  @IsNotEmpty()
  @IsString()
  @IsIn(['sha512', 'sha256'])
  public algorithm: 'sha512' | 'sha526' | null = null;

  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
  })
  public redirect_url: string;

  @Allow()
  public state?: any;
}
