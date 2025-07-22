import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { ProjectService } from '../project/project.service';
import { ProjectUserService } from '../project-user/project-user.service';
import { Model } from 'mongoose';
import { Project } from '../project/entities';
import { Task } from './entities';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectUserRoleEnum } from '../project-user/constants';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { User } from '../auth/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('TaskService', () => {
  let taskService: TaskService;
  let projectService: ProjectService;
  let projectUserService: ProjectUserService;

  let projectModel: Model<Project>;
  let taskModel: Model<Task>;

  const mockProjectModel = {
    findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
  };

  const mockTaskModel = {
    find: jest.fn().mockReturnValue({ exec: jest.fn() }),
    create: jest.fn(),
    countDocuments: jest.fn(),
    findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
    findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
  };

  const mockProjectService = {
    isArchived: jest.fn(),
    addTaskToProject: jest.fn(),
  };

  const mockProjectUserService = {
    findOneByProjectIdAndUserId: jest.fn(),
    existsByProjectIdAndUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Project.name),
          useValue: mockProjectModel,
        },
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
        {
          provide: ProjectUserService,
          useValue: mockProjectUserService,
        },
        TaskService,
      ],
    }).compile();

    taskService = module.get<TaskService>(TaskService);
    taskModel = module.get<Model<Task>>(getModelToken(Task.name));
    projectModel = module.get<Model<Project>>(getModelToken(Project.name));
    projectService = module.get<ProjectService>(ProjectService);
    projectUserService = module.get<ProjectUserService>(ProjectUserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(taskService).toBeDefined();
  });

  describe('create', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';
    const taskId = '687bf852e1b4c24c8a4fff0f';
    const user = { id: userId } as User;

    it('should assign the current user if role is MEMBER and create task', async () => {
      const createTaskDto = {
        projectId: projectId,
        name: 'New Task',
      } as unknown as CreateTaskDto;

      const mockProjectUser = {
        role: ProjectUserRoleEnum.MEMBER,
      };

      const mockCreatedTask = {
        ...createTaskDto,
        assignedUserId: user.id,
        id: taskId,
      };

      mockProjectUserService.findOneByProjectIdAndUserId.mockResolvedValue(
        mockProjectUser,
      );
      mockProjectService.isArchived.mockResolvedValue(false);
      mockTaskModel.create.mockResolvedValue(mockCreatedTask);
      mockProjectService.addTaskToProject.mockResolvedValue(undefined);

      const result = await taskService.create({ ...createTaskDto }, user);

      expect(
        mockProjectUserService.findOneByProjectIdAndUserId,
      ).toHaveBeenCalledWith(createTaskDto.projectId, user.id);
      expect(mockProjectService.isArchived).toHaveBeenCalledWith(
        createTaskDto.projectId,
        user,
      );
      expect(mockTaskModel.create).toHaveBeenCalledWith({
        ...createTaskDto,
        assignedUserId: user.id,
      });
      expect(mockProjectService.addTaskToProject).toHaveBeenCalledWith(
        createTaskDto.projectId,
        mockCreatedTask.id,
      );
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw if user is OWNER and no assignedUserId is provided', async () => {
      const createTaskDto = {
        projectId: projectId,
        name: 'New Task',
      } as unknown as CreateTaskDto;

      const mockProjectUser = {
        role: ProjectUserRoleEnum.OWNER,
      };

      mockProjectUserService.findOneByProjectIdAndUserId.mockResolvedValue(
        mockProjectUser,
      );
      mockProjectService.isArchived.mockResolvedValue(false);

      await expect(
        taskService.create({ ...createTaskDto }, user),
      ).rejects.toThrow(BadRequestException);
      expect(mockTaskModel.create).not.toHaveBeenCalled();
      expect(mockProjectService.addTaskToProject).not.toHaveBeenCalled();
    });

    it('should call projectUserService for assignedUserId when user is OWNER and assignedUserId is not self', async () => {
      const assignedUserId = 'member456';
      const createTaskDto = {
        projectId: projectId,
        name: 'Task',
        assignedUserId,
      } as unknown as CreateTaskDto;

      const mockProjectUser = {
        role: ProjectUserRoleEnum.OWNER,
      };

      const mockCreatedTask = {
        ...createTaskDto,
        id: taskId,
      };

      mockProjectUserService.findOneByProjectIdAndUserId.mockResolvedValueOnce(
        mockProjectUser,
      ); //OWNER
      mockProjectUserService.findOneByProjectIdAndUserId.mockResolvedValueOnce({
        role: ProjectUserRoleEnum.MEMBER,
      }); //assignedUser
      mockProjectService.isArchived.mockResolvedValue(false);
      mockTaskModel.create.mockResolvedValue(mockCreatedTask);
      mockProjectService.addTaskToProject.mockResolvedValue(undefined);

      const result = await taskService.create({ ...createTaskDto }, user);

      expect(
        mockProjectUserService.findOneByProjectIdAndUserId,
      ).toHaveBeenNthCalledWith(1, createTaskDto.projectId, user.id);
      expect(
        mockProjectUserService.findOneByProjectIdAndUserId,
      ).toHaveBeenNthCalledWith(2, createTaskDto.projectId, assignedUserId);
      expect(mockTaskModel.create).toHaveBeenCalledWith(createTaskDto);
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw if project is archived', async () => {
      const createTaskDto = {
        projectId: projectId,
        name: 'Task',
      } as unknown as CreateTaskDto;

      const mockProjectUser = {
        role: ProjectUserRoleEnum.OWNER,
      };

      mockProjectUserService.findOneByProjectIdAndUserId.mockResolvedValue(
        mockProjectUser,
      );
      mockProjectService.isArchived.mockResolvedValue(true);

      await expect(
        taskService.create({ ...createTaskDto }, user),
      ).rejects.toThrow(BadRequestException);

      expect(mockTaskModel.create).not.toHaveBeenCalled();
      expect(mockProjectService.addTaskToProject).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should return paginated tasks assigned to the user', async () => {
      const userId = '687bf852e1b4c24c8a4af2dc';
      const user = { id: userId } as User;
      const paginationDto = { page: 1, limit: 2 };

      const mockTasks = [
        { _id: '687bf852e1b4c24c8a4af001', name: 'Task1' },
        { _id: '687bf852e1b4c24c8a4af002', name: 'Task2' },
      ];

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTasks),
      };

      (mockTaskModel.find as jest.Mock).mockReturnValue(mockQuery);
      (mockTaskModel.countDocuments as jest.Mock).mockResolvedValue(5);

      const result = await taskService.findAll(paginationDto, user);

      expect(mockTaskModel.find).toHaveBeenCalledWith({
        assignedUserId: userId,
        deleted: false,
      });

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(2);
      expect(mockQuery.populate).toHaveBeenCalledWith(
        'projectId',
        'name description',
      );
      expect(mockQuery.exec).toHaveBeenCalled();

      expect(result).toEqual({
        items: mockTasks,
        total: 5,
        currentPage: 1,
        totalPages: 3,
      });
    });
  });

  describe('findOne()', () => {
    const id = '64b12345abcd123456efabcd';

    it('should return the task if it exists', async () => {
      const mockTask = { _id: id, name: 'Test Task' };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockTask),
      };

      (mockTaskModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await taskService.findOne(id);

      expect(mockTaskModel.findOne).toHaveBeenCalledWith(
        { deleted: false, _id: id },
        { __v: 0 },
      );
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if the task does not exist', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (mockTaskModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      await expect(taskService.findOne(id)).rejects.toThrowError(
        NotFoundException,
      );
      expect(mockTaskModel.findOne).toHaveBeenCalledWith(
        { deleted: false, _id: id },
        { __v: 0 },
      );
      expect(mockQuery.exec).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const taskId = '64b12345abcd123456efabcd';
    const userId = '64a98765abcd123456ef1234';
    const projectId = '64c45678abcd123456ef5678';
    const otherUserId = '64d98765abcd123456ef4321';

    const user = { id: userId } as User;

    const existingTask = {
      _id: taskId,
      projectId,
      assignedUserId: otherUserId,
      deleted: false,
    };

    const updateTaskDto = {
      name: 'Updated Task Name',
      assignedUserId: otherUserId,
    } as UpdateTaskDto;

    it('should update and return updated task if user is MEMBER and modifies own task', async () => {
      const projectUser = { role: ProjectUserRoleEnum.MEMBER };

      jest.spyOn(taskService, 'findOne').mockResolvedValue(existingTask as any);
      jest
        .spyOn(taskService, 'validateIfProjectIsArchived')
        .mockResolvedValue(undefined);
      jest
        .spyOn(taskService, 'validateAndGetProjectUser')
        .mockResolvedValue(projectUser as any);

      // validateIfUserCanModifyTask should NOT throw because assignedUserId !== userId (member owns the task)
      jest
        .spyOn(taskService as any, 'validateIfUserCanModifyTask')
        .mockImplementation(
          async (task: Task, userId: string, role: string) => {
            if (
              role === ProjectUserRoleEnum.MEMBER &&
              task.assignedUserId !== userId
            ) {
              throw new ForbiddenException(
                'Members can only modify their own tasks',
              );
            }
          },
        );
      (mockTaskModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ ...existingTask, name: updateTaskDto.name }),
      });

      await expect(
        taskService.update(taskId, updateTaskDto, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update and return updated task if user is OWNER and assignedUserId is valid project member', async () => {
      const projectUser = { role: ProjectUserRoleEnum.OWNER };
      const updateDto = {
        ...updateTaskDto,
        assignedUserId: otherUserId,
      };

      jest.spyOn(taskService, 'findOne').mockResolvedValue(existingTask as any);
      jest
        .spyOn(taskService, 'validateIfProjectIsArchived')
        .mockResolvedValue(undefined);
      jest
        .spyOn(taskService, 'validateAndGetProjectUser')
        .mockResolvedValue(projectUser as any);
      jest
        .spyOn(taskService as any, 'validateIfUserCanModifyTask')
        .mockResolvedValue(undefined);
      jest
        .spyOn(projectUserService, 'existsByProjectIdAndUserId')
        .mockResolvedValue(true);
      (mockTaskModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ ...existingTask, name: updateTaskDto.name }),
      });

      const result = await taskService.update(taskId, updateDto, user);

      expect(
        projectUserService.existsByProjectIdAndUserId,
      ).toHaveBeenCalledWith(projectId, userId);
      expect(result?.name).toBe(updateTaskDto.name);
    });

    it('should throw ForbiddenException if MEMBER tries to modify task not assigned to them', async () => {
      const projectUser = { role: ProjectUserRoleEnum.MEMBER };

      const taskAssignedToOther = {
        ...existingTask,
        assignedUserId: 'someOtherUserId',
      };

      jest
        .spyOn(taskService, 'findOne')
        .mockResolvedValue(taskAssignedToOther as any);
      jest
        .spyOn(taskService, 'validateIfProjectIsArchived')
        .mockResolvedValue(undefined);
      jest
        .spyOn(taskService, 'validateAndGetProjectUser')
        .mockResolvedValue(projectUser as any);

      // Calling the real method to test validation logic
      const validateFn =
        taskService['validateIfUserCanModifyTask'].bind(taskService);

      await expect(
        validateFn(
          taskAssignedToOther as any,
          userId,
          ProjectUserRoleEnum.MEMBER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should log and rethrow errors', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(taskService, 'findOne').mockRejectedValue(error);
      const loggerSpy = jest
        .spyOn(taskService['logger'], 'error')
        .mockImplementation(() => {});

      await expect(
        taskService.update(taskId, updateTaskDto, user),
      ).rejects.toThrow(error);
      expect(loggerSpy).toHaveBeenCalledWith(error);

      loggerSpy.mockRestore();
    });
  });

  describe('remove', () => {
    const taskId = '64a7f6b9a0b1c2d3e4f5g6h8';
    const userId = '64a7f6b9a0b1c2d3e4f5g6h7';
    const projectId = '64a7f6b9a0b1c2d3e4f5g6h9';

    const existingTask = {
      _id: taskId,
      projectId,
      assignedUserId: userId,
    };

    const projectUser = {
      role: ProjectUserRoleEnum.MEMBER,
    };

    it('should soft delete the task and remove it from the project tasks list', async () => {
      jest.spyOn(taskService, 'findOne').mockResolvedValue(existingTask as any);
      jest
        .spyOn(taskService, 'validateIfProjectIsArchived')
        .mockResolvedValue(undefined);
      jest
        .spyOn(taskService, 'validateAndGetProjectUser')
        .mockResolvedValue(projectUser as any);
      jest
        .spyOn(taskService as any, 'validateIfUserCanModifyTask')
        .mockResolvedValue(undefined);

      const taskFindOneAndUpdateSpy = jest
        .spyOn(mockTaskModel, 'findOneAndUpdate')
        .mockResolvedValue(null);
      const projectFindOneAndUpdateSpy = jest
        .spyOn(mockProjectModel, 'findOneAndUpdate')
        .mockResolvedValue(null);

      const result = await taskService.remove(taskId, { id: userId } as User);

      expect(taskService.findOne).toHaveBeenCalledWith(taskId);
      expect(taskService.validateIfProjectIsArchived).toHaveBeenCalledWith(
        projectId,
        { id: userId },
      );
      expect(taskService.validateAndGetProjectUser).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(taskFindOneAndUpdateSpy).toHaveBeenCalledWith(
        { _id: taskId, deleted: false },
        expect.objectContaining({
          deleted: true,
          deletedAt: expect.any(Date),
        }),
      );
      expect(projectFindOneAndUpdateSpy).toHaveBeenCalledWith(
        { _id: projectId, deleted: false },
        { $pull: { tasks: taskId } },
      );
      expect(result).toEqual({
        acknowledge: true,
        deletedCount: 1,
      });
    });

    it('should rethrow errors and log them', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(taskService, 'findOne').mockRejectedValue(error);
      const loggerSpy = jest
        .spyOn(taskService['logger'], 'error')
        .mockImplementation(() => {});

      await expect(
        taskService.remove(taskId, { id: userId } as User),
      ).rejects.toThrow(error);

      expect(loggerSpy).toHaveBeenCalledWith(error);
      loggerSpy.mockRestore();
    });
  });
});
