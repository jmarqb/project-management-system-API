import { ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MembersToProjectDto {
  @ApiProperty({
    example: ['687c0a91375b7888a9e66393'],
  })
  @IsString({ each: true })
  @ArrayNotEmpty({ message: 'The list of user IDs must not be empty' })
  usersIds: string[];
}
