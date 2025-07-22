import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { PaginationDto } from '../common';
import { User } from '../auth/entities/user.entity';
import { ProjectUser } from '../project-user/entities';

describe('TaskController', () => {
  let taskController: TaskController;
  let taskService: TaskService;

  beforeEach(async () => {
    const mockTaskService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOneWithPopulate: jest.fn(),
      validateAndGetProjectUser: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    taskController = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(taskController).toBeDefined();
  });

  const userId = '64ab1234567890abcdef9874';
  const user = { id: userId } as User;
  const projectId = '64ab1234567890abcdef1234';

  describe('create', () => {
    it('should call taskService.create with correct DTO and user', async () => {
      const createTaskDto = {
        projectId: projectId,
        name: 'New Task',
      } as CreateTaskDto;

      await taskController.create(createTaskDto, user);

      expect(taskService.create).toHaveBeenCalledWith(createTaskDto, user);
    });
  });

  describe('findAll', () => {
    it('should call taskService.findAll with pagination DTO and user', async () => {
      const paginationDto = { page: 1, limit: 5 } as PaginationDto;

      await taskController.findAll(paginationDto, user);

      expect(taskService.findAll).toHaveBeenCalledWith(paginationDto, user);
    });
  });

  describe('findOne', () => {
    it('should call taskService.findOneWithPopulate and validateAndGetProjectUser with correct params', async () => {
      const taskId = '64ab1234567890abcdef1234';

      const mockTask = { projectId: projectId };
      jest
        .spyOn(taskService, 'findOneWithPopulate')
        .mockResolvedValue(mockTask as any);
      jest
        .spyOn(taskService, 'validateAndGetProjectUser')
        .mockResolvedValue(ProjectUser as any);

      const result = await taskController.findOne(taskId, user);

      expect(taskService.findOneWithPopulate).toHaveBeenCalledWith(
        taskId,
        user,
      );
      expect(taskService.validateAndGetProjectUser).toHaveBeenCalledWith(
        mockTask.projectId,
        user.id,
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('should call taskService.update with correct params', async () => {
      const taskId = '64ab1234567890abcdef1234';
      const updateTaskDto = { name: 'Updated Task Name' } as UpdateTaskDto;
      await taskController.update(taskId, updateTaskDto, user);
      expect(taskService.update).toHaveBeenCalledWith(
        taskId,
        updateTaskDto,
        user,
      );
    });
  });

  describe('remove', () => {
    it('should call taskService.remove with correct params', async () => {
      const taskId = '64ab1234567890abcdef1234';
      await taskController.remove(taskId, user);
      expect(taskService.remove).toHaveBeenCalledWith(taskId, user);
    });
  });
});
