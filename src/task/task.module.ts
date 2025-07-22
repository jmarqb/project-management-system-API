import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './entities';
import { ProjectModule } from '../project/project.module';
import { ProjectUserModule } from '../project-user/project-user.module';
import { Project, ProjectSchema } from '../project/entities';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Task.name,
        schema: TaskSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
    ProjectModule,
    ProjectUserModule,
  ],
})
export class TaskModule {}
