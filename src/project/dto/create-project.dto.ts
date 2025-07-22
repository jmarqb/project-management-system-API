import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'advent-code',
    description: 'Defining the project name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @ApiProperty({
    example: 'advent-code description',
    description: 'Defining the project description',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(60)
  description: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
