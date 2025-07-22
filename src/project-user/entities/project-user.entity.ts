import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Project } from '../../project/entities';
import { ProjectUserRoleEnum } from '../constants';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class ProjectUser {
  @ApiProperty({
    example: '6522b214dbabfa715eb97177',
    description: 'The project id',
    type: String,
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true,
  })
  projectId: string;

  @ApiProperty({
    example: '6522b214dbabfa715eb97177',
    description: 'The user id',
    type: String,
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  userId: string;

  @ApiProperty({
    example: 'MEMBER',
    description: 'Defining the project-user role',
    enum: Object.values(ProjectUserRoleEnum),
  })
  @Prop({
    index: true,
    required: true,
    type: String,
    enum: Object.values(ProjectUserRoleEnum),
  })
  role: ProjectUserRoleEnum;

  @ApiProperty()
  @Prop({ index: true, type: Boolean, required: false, default: false })
  deleted: boolean;

  @ApiProperty()
  @Prop({ index: true, type: Date, required: false })
  deletedAt?: Date;
}

export const ProjectUserSchema = SchemaFactory.createForClass(ProjectUser);
ProjectUserSchema.set('versionKey', false);
ProjectUserSchema.set('timestamps', true);

ProjectUserSchema.methods.toJSON = function () {
  const { _id, ...data } = this.toObject();
  data.id = _id;
  return data;
};
