import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReferralInviteDto {
  @IsOptional()
  @IsEmail()
  inviteeEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  note?: string;
}





