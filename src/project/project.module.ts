import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './entities';
import { ProjectUserModule } from '../project-user/project-user.module';
import { ProjectUser, ProjectUserSchema } from '../project-user/entities';
import { Task, TaskSchema } from '../task/entities';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: ProjectUser.name,
        schema: ProjectUserSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),
    ProjectUserModule,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
