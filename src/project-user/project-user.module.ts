import { Module } from '@nestjs/common';
import { ProjectUserService } from './project-user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectUser, ProjectUserSchema } from './entities';

@Module({
  controllers: [],
  providers: [ProjectUserService],
  imports: [
    MongooseModule.forFeature([
      {
        name: ProjectUser.name,
        schema: ProjectUserSchema,
      },
    ]),
  ],
  exports: [ProjectUserService],
})
export class ProjectUserModule {}
