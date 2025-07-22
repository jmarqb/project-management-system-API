import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskStatusEnum } from '../constants';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriorityEnum } from '../constants/task-priority.enum';
import mongoose from 'mongoose';
import { Project } from '../../project/entities';

@Schema()
export class Task {
  @ApiProperty({
    example: 'Task Name',
    description: 'Defining the task name',
    type: String,
  })
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Defining the task status',
    enum: Object.values(TaskStatusEnum),
  })
  @Prop({
    index: true,
    type: String,
    required: true,
    enum: Object.values(TaskStatusEnum),
    default: TaskStatusEnum.PENDING,
  })
  taskStatus: TaskStatusEnum;

  @ApiProperty({
    example: 'LOW',
    description: 'Defining the task priority',
    enum: Object.values(TaskPriorityEnum),
  })
  @Prop({
    index: true,
    type: String,
    required: true,
    default: TaskPriorityEnum.LOW,
    enum: Object.values(TaskPriorityEnum),
  })
  priority: TaskPriorityEnum;

  @ApiProperty({
    example: '6522b214dbabfa715eb97177',
    description: 'The project id',
    type: String,
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Project',
  })
  projectId: string;

  @ApiProperty({
    example: '6522b214dbabfa715eb97177',
    description: 'The assigned user id',
    type: String,
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  assignedUserId: string;

  @ApiProperty()
  @Prop({ index: true, type: Boolean, required: false, default: false })
  deleted: boolean;

  @ApiProperty()
  @Prop({ index: true, type: Date, required: false })
  deletedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.set('versionKey', false);
TaskSchema.set('timestamps', true);

TaskSchema.methods.toJSON = function () {
  const { _id, ...data } = this.toObject();
  data.id = _id;
  return data;
};
