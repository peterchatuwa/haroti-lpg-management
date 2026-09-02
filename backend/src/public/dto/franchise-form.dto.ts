import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FranchiseFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nationalId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  dateOfBirth!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  district!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  town!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  locationDetails!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  hasExperience!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  motivation!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  capitalRange!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  specialProgramme!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
