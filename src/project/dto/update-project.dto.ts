import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiProperty({
    example: 'advent-code',
    description: 'Defining the project name',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @ApiProperty({
    example: 'advent-code description',
    description: 'Defining the project description',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(60)
  description: string;

  @ApiProperty({
    description: 'set archived true or false',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
