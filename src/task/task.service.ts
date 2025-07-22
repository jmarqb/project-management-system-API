import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './entities';
import { Model } from 'mongoose';
import { ProjectService } from '../project/project.service';
import { ProjectUserService } from '../project-user/project-user.service';
import { User } from '../auth/entities/user.entity';
import { ProjectUserRoleEnum } from '../project-user/constants';
import { PaginationDto } from '../common';
import { Project } from '../project/entities';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<Task>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Task>,
    private readonly projectService: ProjectService,
    private readonly projectUserService: ProjectUserService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User) {
    await this.assignTaskUser(createTaskDto, user);
    const task = await this.taskModel.create(createTaskDto);
    await this.projectService.addTaskToProject(task.projectId, task.id);
    return task;
  }

  private async assignTaskUser(createTaskDto: CreateTaskDto, user: User) {
    const { projectId } = createTaskDto;
    const projectUser = await this.validateAndGetProjectUser(
      projectId,
      user.id,
    );
    await this.validateIfProjectIsArchived(projectId, user);

    const { role } = projectUser;
    if (role === ProjectUserRoleEnum.MEMBER) {
      createTaskDto.assignedUserId = user.id;
    } else if (role === ProjectUserRoleEnum.OWNER) {
      if (!createTaskDto.assignedUserId) {
        throw new BadRequestException({
          message: 'As owner, you must specify the assigned user for the task.',
          reference: 'NOT_ASSIGNED_USER',
        });
      }
      if (createTaskDto.assignedUserId !== user.id) {
        await this.projectUserService.findOneByProjectIdAndUserId(
          createTaskDto.projectId,
          createTaskDto.assignedUserId,
        );
      }
    }
  }

  async findAll(paginationDto: PaginationDto, user: User) {
    let { page, limit } = paginationDto;
    page == null ? (page = 1) : page;
    limit == null ? (limit = 10) : limit;

    const offset = (page - 1) * limit;

    const tasks = await this.taskModel
      .find({ assignedUserId: user.id, deleted: false })
      .skip(offset)
      .limit(limit)
      .populate('projectId', 'name description')
      .exec();

    const total = await this.taskModel.countDocuments({
      assignedUserId: user.id,
      deleted: false,
    });
    const totalPages = Math.ceil(total / limit);

    return {
      items: tasks,
      total,
      currentPage: page,
      totalPages,
    };
  }

  async findOne(id: string) {
    try {
      const task = await this.taskModel
        .findOne(
          {
            deleted: false,
            _id: id,
          },
          { __v: 0 },
        )
        .exec();

      if (!task) {
        throw new NotFoundException({
          message: `The task with the id ${id} not found`,
          reference: 'TASK_NOT_FOUND',
        });
      }

      return task;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async findOneWithPopulate(id: string, user: User) {
    const task = await this.findOne(id);
    await this.validateAndGetProjectUser(task.projectId, user.id);
    return await task.populate('projectId', 'name description');
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User) {
    try {
      const task = await this.findOne(id);

      await this.validateIfProjectIsArchived(task.projectId, user);

      const projectUser = await this.validateAndGetProjectUser(
        task.projectId,
        user.id,
      );
      const { role } = projectUser;
      await this.validateIfUserCanModifyTask(task, user.id, role);

      updateTaskDto.assignedUserId = user.id;

      if (role === ProjectUserRoleEnum.OWNER) {
        const { assignedUserId } = updateTaskDto;
        if (assignedUserId && assignedUserId !== task.assignedUserId) {
          const assignedUserIsMember =
            await this.projectUserService.existsByProjectIdAndUserId(
              task.projectId,
              assignedUserId,
            );
          if (!assignedUserIsMember) {
            throw new BadRequestException({
              message: `The assignedUserId ${assignedUserId} is not a member in project ${task.projectId}`,
              reference: 'BAD_REQUEST',
            });
          }
        }
      }

      return await this.taskModel
        .findOneAndUpdate({ _id: task._id, deleted: false }, updateTaskDto, {
          new: true,
          projection: { __v: 0 },
        })
        .populate('projectId', 'name description')
        .exec();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async remove(id: string, user: User) {
    try {
      const task = await this.findOne(id);
      await this.validateIfProjectIsArchived(task.projectId, user);
      const projectUser = await this.validateAndGetProjectUser(
        task.projectId,
        user.id,
      );
      await this.validateIfUserCanModifyTask(task, user.id, projectUser.role);
      await this.taskModel.findOneAndUpdate(
        { _id: task._id, deleted: false },
        { deleted: true, deletedAt: new Date() },
      );

      await this.projectModel.findOneAndUpdate(
        { _id: task.projectId, deleted: false },
        {
          $pull: { tasks: task._id },
        },
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

  async validateIfUserCanModifyTask(task: Task, userId: string, role: string) {
    if (role === ProjectUserRoleEnum.MEMBER) {
      if (task.assignedUserId.toString() !== userId) {
        throw new ForbiddenException({
          message: `Members can only modify their own tasks`,
          reference: 'TASK_FORBIDDEN_ACCESS',
        });
      }
    }
  }

  async validateAndGetProjectUser(projectId: string, userId: string) {
    return await this.projectUserService.findOneByProjectIdAndUserId(
      projectId,
      userId,
    );
  }

  async validateIfProjectIsArchived(projectId: string, user: User) {
    const isArchived = await this.projectService.isArchived(projectId, user);

    if (isArchived) {
      throw new BadRequestException({
        message: `Cannot modify task because project with ID ${projectId} is archived`,
        reference: 'PROJECT_IS_ARCHIVED',
      });
    }
  }
}
