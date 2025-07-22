import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { User } from '../auth/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Project } from './entities';
import { Model } from 'mongoose';
import { ProjectUserService } from '../project-user/project-user.service';
import { ProjectUserRoleEnum } from '../project-user/constants';
import { DeleteResponseDto, PaginationDto } from '../common';
import { MembersToProjectDto } from './dto/members-to-project.dto';
import { CreateProjectUserDto } from '../project-user/dto/create-project-user.dto';
import { Task } from '../task/entities';
import { ProjectUser } from '../project-user/entities';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<Task>,
    @InjectModel(ProjectUser.name)
    private readonly projectUserModel: Model<ProjectUser>,
    private readonly projectUserService: ProjectUserService,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: User) {
    try {
      createProjectDto.ownerId = user?.id;

      const project = await this.projectModel.create(createProjectDto);

      await this.projectUserService.create({
        projectId: project._id.toString(),
        userId: project.ownerId.toString(),
        role: ProjectUserRoleEnum.OWNER,
      });

      return project;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async findAll(paginationDto: PaginationDto, user: User) {
    let { page, limit } = paginationDto;
    page == null ? (page = 1) : page;
    limit == null ? (limit = 10) : limit;

    const offset = (page - 1) * limit;

    const filter = {
      $and: [
        { deleted: false },
        {
          $or: [{ ownerId: user.id }, { members: user.id }],
        },
      ],
    };
    const projects = await this.projectModel
      .find(filter)
      .skip(offset)
      .limit(limit)
      .populate('tasks', 'name taskStatus priority assignedUserId')
      .populate('members', 'firstName lastName email')
      .exec();
    const total = await this.projectModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(total / limit);

    return {
      items: projects,
      total,
      currentPage: page,
      totalPages,
    };
  }

  async findOne(id: string, user: User) {
    try {
      const project = await this.projectModel
        .findOne(
          {
            $and: [
              { deleted: false, _id: id },
              {
                $or: [{ ownerId: user.id }, { members: user.id }],
              },
            ],
          },
          { __v: 0 },
        )
        .exec();
      if (!project) {
        throw new NotFoundException({
          message: `The project with the id ${id} not found`,
          reference: 'PROJECT_NOT_FOUND',
        });
      }
      return project;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async findOneWithPopulate(id: string, user: User) {
    const project = await this.findOne(id, user);

    return await (
      await project.populate('members', 'firstName lastName email')
    ).populate('tasks', 'name taskStatus priority assignedUserId');
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, user: User) {
    try {
      const project = await this.findOne(id, user);

      if (project.ownerId.toString() !== user.id) {
        throw new ForbiddenException({
          message: 'Only the project owner can update the project.',
          reference: 'UNAUTHORIZED_NOT_PROJECT_OWNER',
        });
      }

      return await this.projectModel
        .findOneAndUpdate({ _id: project._id }, updateProjectDto, {
          new: true,
          projection: { __v: 0 },
        })
        .populate('members', 'firstName lastName email')
        .populate('tasks', 'name taskStatus priority assignedUserId')
        .exec();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async remove(id: string, user: User): Promise<DeleteResponseDto> {
    try {
      const project = await this.findOne(id, user);

      if (project.ownerId.toString() !== user.id) {
        throw new ForbiddenException({
          message: 'Only the project owner can delete the project.',
          reference: 'UNAUTHORIZED_NOT_PROJECT_OWNER',
        });
      }

      await this.projectModel.findOneAndUpdate(
        { _id: project._id, deleted: false },
        { deleted: true, deletedAt: new Date() },
      );

      return {
        acknowledge: true,
        deletedCount: 1,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async addMembersToProject(
    projectId: string,
    membersToProjectDto: MembersToProjectDto,
    user: User,
  ) {
    try {
      const project = await this.findOne(projectId, user);

      const existingMembers = membersToProjectDto.usersIds.filter(
        (userId) => !project.members?.includes(userId),
      );

      if (existingMembers.length === 0) {
        throw new BadRequestException({
          message: 'The users are already project members',
          reference: 'USERS_ALREADY_MEMBERS',
        });
      }
      const projectUser =
        await this.projectUserService.findOneByProjectIdAndUserId(
          projectId,
          user.id,
        );

      if (projectUser.role !== ProjectUserRoleEnum.OWNER) {
        throw new ForbiddenException({
          message: 'Only the project owner can add members',
          reference: 'UNAUTHORIZED_NOT_PROJECT_OWNER',
        });
      }

      const createdProjectUsers = await this.insertProjectUsers(
        projectId,
        membersToProjectDto,
      );

      return await this.updateNewMembers(project.id, createdProjectUsers);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async insertProjectUsers(
    projectId: string,
    membersToProjectDto: MembersToProjectDto,
  ) {
    let usersList: CreateProjectUserDto[] = [];

    for (const userId of membersToProjectDto.usersIds) {
      const alreadyExists =
        await this.projectUserService.existsByProjectIdAndUserId(
          projectId,
          userId,
        );
      if (alreadyExists) continue;
      usersList.push({
        projectId,
        userId,
        role: ProjectUserRoleEnum.MEMBER,
      });
    }
    return await this.projectUserService.createMany(usersList);
  }

  private async updateNewMembers(projectId: string, membersIds: string[]) {
    return await this.projectModel
      .findOneAndUpdate(
        { _id: projectId },
        {
          $addToSet: {
            members: { $each: membersIds },
          },
        },
        {
          new: true,
          projection: { __v: 0 },
        },
      )
      .populate('members', 'firstName lastName email')
      .populate('tasks', 'name taskStatus priority assignedUserId')
      .exec();
  }

  async removeMember(projectId: string, memberId: string, user: User) {
    const project = await this.findOne(projectId, user);
    const projectUserReq = await this.validateAndGetProjectUser(
      projectId,
      user.id,
    );

    if (projectUserReq.role !== ProjectUserRoleEnum.OWNER) {
      throw new ForbiddenException({
        message: 'Only the project owner can remove members',
        reference: 'PROJECT_FORBIDDEN_ACCESS',
      });
    }

    if (user.id === memberId) {
      throw new BadRequestException({
        message: 'The project owner cannot remove themselves',
        reference: 'BAD_REQUEST',
      });
    }

    const memberToRemove = await this.validateAndGetProjectUser(
      projectId,
      memberId,
    );
    const memberTasks = await this.taskModel
      .find({
        deleted: false,
        projectId,
        assignedUserId: memberId,
      })
      .exec();

    if (memberTasks.length > 0) {
      await this.taskModel.updateMany(
        { _id: { $in: memberTasks.map((task) => task._id) } },
        {
          $set: {
            assignedUserId: user.id,
            projectId: project.id,
          },
        },
      );
    }
    await this.projectUserModel.updateOne(
      { _id: memberToRemove._id },
      {
        $set: {
          deleted: true,
          deletedAt: new Date(),
        },
      },
    );

    return await this.projectModel
      .findOneAndUpdate(
        { _id: projectId, deleted: false },
        {
          $pull: { members: memberToRemove.userId },
        },
        {
          new: true,
          projection: { __v: 0 },
        },
      )
      .populate('members', 'firstName lastName email')
      .populate('tasks', 'name taskStatus priority assignedUserId')
      .exec();
  }

  async validateAndGetProjectUser(projectId: string, userId: string) {
    return await this.projectUserService.findOneByProjectIdAndUserId(
      projectId,
      userId,
    );
  }

  async isArchived(projectId: string, user: User) {
    const project = await this.findOne(projectId, user);
    return project.archived;
  }

  async addTaskToProject(projectId: string, taskId: string) {
    await this.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $addToSet: {
          tasks: taskId,
        },
      },
    );
  }
}
