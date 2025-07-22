import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectUserDto } from './dto/create-project-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProjectUser } from './entities';
import { Model } from 'mongoose';

@Injectable()
export class ProjectUserService {
  private readonly logger = new Logger(ProjectUserService.name);

  constructor(
    @InjectModel(ProjectUser.name)
    private readonly projectUserModel: Model<ProjectUser>,
  ) {}

  async create(createProjectUserDto: CreateProjectUserDto) {
    try {
      const { projectId, userId, role } = createProjectUserDto;

      if (!projectId || !userId || !role) {
        throw new BadRequestException({
          message: 'Missing required fields: projectId, userId, or role',
          reference: 'PROJECT_USER_CREATE_MISSING_DATA',
        });
      }

      const projectUserCreated =
        await this.projectUserModel.create(createProjectUserDto);
      return projectUserCreated.toObject();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async createMany(dtos: CreateProjectUserDto[]) {
    try {
      if (!dtos || !Array.isArray(dtos) || dtos.length === 0) {
        throw new BadRequestException({
          message: 'The list of project users is empty or invalid',
          reference: 'PROJECT_USER_CREATE_MANY_MISSING_DATA',
        });
      }

      for (const dto of dtos) {
        const { projectId, userId, role } = dto;
        if (!projectId || !userId || !role) {
          throw new BadRequestException({
            message:
              'One or more items are missing required fields: projectId, userId, or role',
            reference: 'PROJECT_USER_CREATE_MANY_ITEM_INVALID',
          });
        }
      }

      const createdUsers = await this.projectUserModel.insertMany(dtos);
      return createdUsers.map((doc) => doc.userId);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findOneByProjectIdAndUserId(projectId: string, userId: string) {
    try {
      const projectUser = await this.projectUserModel
        .findOne(
          {
            deleted: false,
            projectId,
            userId,
          },
          { __v: 0 },
        )
        .exec();

      if (!projectUser) {
        throw new NotFoundException({
          message: `Project with id ${projectId} not found for user with id ${userId}`,
          reference: 'PROJECT_TO_USER_NOT_FOUND',
        });
      }
      return projectUser;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async existsByProjectIdAndUserId(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      return !!(await this.projectUserModel.exists({
        deleted: false,
        projectId,
        userId,
      }));
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
