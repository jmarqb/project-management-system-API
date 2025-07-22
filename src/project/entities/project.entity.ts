import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Task } from '../../task/entities';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';

@Schema()
export class Project {
  @ApiProperty({
    example: 'Project Name',
    description: 'Defining the project name',
    type: String,
  })
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @ApiProperty({
    example: 'Project Description',
    description: 'Defining the project description',
    type: String,
  })
  @Prop({
    type: String,
    required: true,
  })
  description: string;

  @ApiProperty()
  @Prop({ type: Boolean, index: true, required: false, default: false })
  archived: boolean;

  @ApiProperty({
    example: '6522b214dbabfa715eb97177',
    description: 'The owner id',
    type: String,
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  ownerId: string;

  @ApiProperty({
    example: '[6522b214dbabfa715eb97177]',
    description: 'The members ids',
    type: String,
  })
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: User.name,
    index: true,
  })
  members?: string[];

  @ApiProperty({
    example: '[6522b214dbabfa715eb97177]',
    description: 'The tasks ids',
    type: String,
  })
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: Task.name,
    index: true,
  })
  tasks?: string[];

  @ApiProperty()
  @Prop({ index: true, type: Boolean, required: false, default: false })
  deleted: boolean;

  @ApiProperty()
  @Prop({ index: true, type: Date, required: false })
  deletedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.set('versionKey', false);
ProjectSchema.set('timestamps', true);

ProjectSchema.methods.toJSON = function () {
  const { _id, ...data } = this.toObject();
  data.id = _id;
  return data;
};
