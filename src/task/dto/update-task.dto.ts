import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusEnum } from '../constants';
import { TaskPriorityEnum } from '../constants/task-priority.enum';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({
    example: 'advent-code',
    description: 'Defining the task name',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  name?: string;

  @ApiProperty({ example: '6572dedb29772f9e489cea40' })
  @IsMongoId()
  @IsOptional()
  assignedUserId?: string;

  @ApiProperty({
    enum: TaskStatusEnum,
  })
  @IsString()
  @IsEnum(TaskStatusEnum)
  @IsOptional()
  status?: TaskStatusEnum;

  @ApiProperty({
    enum: TaskPriorityEnum,
  })
  @IsString()
  @IsEnum(TaskPriorityEnum)
  @IsOptional()
  priority?: TaskPriorityEnum;
}
