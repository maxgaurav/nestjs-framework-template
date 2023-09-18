import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GrantTypes } from '../grant-types/grant-type-implementation';

export class AccessTokenDto {
  @ApiProperty({ nullable: true, required: false })
  @ValidateIf((obj) => obj.grant_type === GrantTypes.ImplicitPassword)
  @IsNotEmpty()
  @IsEmail()
  public email: string | null = null;

  @ApiProperty({ nullable: true, required: false })
  @ValidateIf((obj) => obj.grant_type === GrantTypes.ImplicitPassword)
  @IsNotEmpty()
  @IsString()
  public password: string | null = null;

  @ApiProperty({ required: false, nullable: true })
  @ValidateIf(
    (obj) =>
      obj.grant_type === GrantTypes.ImplicitPassword ||
      obj.grant_type === GrantTypes.AuthorizationCode,
  )
  @IsNotEmpty()
  @IsString()
  @IsUUID(4)
  public client_id: string | null = null;

  @ApiProperty({ nullable: true, required: false })
  @ValidateIf(
    (obj) =>
      obj.grant_type === GrantTypes.ImplicitPassword ||
      obj.grant_type === GrantTypes.AuthorizationCode,
  )
  @IsNotEmpty()
  @IsString()
  public client_secret: string | null = null;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GrantTypes)
  public grant_type: GrantTypes;

  @ApiProperty({ required: false, nullable: true })
  @ValidateIf((obj) => obj.grant_type === GrantTypes.PKCE)
  @IsNotEmpty()
  @IsString()
  public code_verifier: string | null = null;

  @ApiProperty({ required: false, nullable: true })
  @ValidateIf(
    (obj) =>
      obj.grant_type === GrantTypes.PKCE ||
      obj.grant_type === GrantTypes.AuthorizationCode,
  )
  @IsNotEmpty()
  @IsUUID(4)
  public code: string | null = null;
}
