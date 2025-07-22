import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { Model } from 'mongoose';
import { Task } from '../task/entities';
import { ProjectUser } from '../project-user/entities';
import { Project } from './entities';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectUserService } from '../project-user/project-user.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { User } from '../auth/entities/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectUserRoleEnum } from '../project-user/constants';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectUserService: ProjectUserService;

  let projectModel: Model<Project>;
  let taskModel: Model<Task>;
  let projectUserModel: Model<ProjectUser>;

  const mockProjectModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
    countDocuments: jest.fn(),
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
  };

  const mockTaskModel = {
    find: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockProjectUserModel = {
    updateOne: jest.fn(),
  };

  const mockProjectUserService = {
    create: jest.fn(),
    findOneByProjectIdAndUserId: jest.fn(),
    existsByProjectIdAndUserId: jest.fn(),
    createMany: jest.fn(),
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
          provide: getModelToken(ProjectUser.name),
          useValue: mockProjectUserModel,
        },
        {
          provide: ProjectUserService,
          useValue: mockProjectUserService,
        },
        ProjectService,
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
    projectUserService = module.get<ProjectUserService>(ProjectUserService);
    projectModel = module.get<Model<Project>>(getModelToken('Project'));
    projectUserModel = module.get<Model<ProjectUser>>(
      getModelToken('ProjectUser'),
    );
    taskModel = module.get<Model<Task>>(getModelToken('Task'));
  });

  it('should be defined', () => {
    expect(projectService).toBeDefined();
  });

  describe('create()', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';
    const user = { id: userId } as User;
    const dto: CreateProjectDto = {
      name: 'project name',
      description: 'project description',
    };

    it('should create a project and assign owner role to user', async () => {
      const createdProject = {
        _id: projectId,
        name: dto.name,
        description: dto.description,
        ownerId: userId,
      };

      jest
        .spyOn(projectModel, 'create')
        .mockResolvedValue(createdProject as any);
      jest.spyOn(projectUserService, 'create').mockResolvedValue({
        projectId,
        userId,
        role: 'OWNER',
      } as any);

      const result = await projectService.create(dto, user);

      expect(projectModel.create).toHaveBeenCalledWith({
        ...dto,
        ownerId: userId,
      });

      expect(projectUserService.create).toHaveBeenCalledWith({
        projectId,
        userId,
        role: 'OWNER',
      });

      expect(result).toEqual(createdProject);
    });

    it('should throw and log error if project creation fails', async () => {
      const error = new Error('DB error');

      jest.spyOn(projectModel, 'create').mockRejectedValue(error);
      const loggerSpy = jest
        .spyOn(projectService['logger'], 'error')
        .mockImplementation(() => {});

      await expect(projectService.create(dto, user)).rejects.toThrow(
        'DB error',
      );
      expect(loggerSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('findAll()', () => {
    it('should return paginated projects', async () => {
      const userId = '687bf852e1b4c24c8a4af2dc';
      const user = { id: userId } as User;
      const paginationDto = { page: 1, limit: 2 };

      const mockProjects = [
        { _id: '687bf852e1b4c24c8a4af000', name: 'Project 1' },
        { _id: '687bf852e1b4c24c8a4af001', name: 'Project 2' },
      ];

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProjects),
      };

      (mockProjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (mockProjectModel.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await projectService.findAll(paginationDto, user);

      expect(mockProjectModel.find).toHaveBeenCalledWith({
        $and: [
          { deleted: false },
          {
            $or: [{ ownerId: userId }, { members: userId }],
          },
        ],
      });

      expect(result).toEqual({
        items: mockProjects,
        total: 5,
        currentPage: 1,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';
    const user = { id: userId } as User;

    const filter = {
      $and: [
        { deleted: false, _id: projectId },
        {
          $or: [{ ownerId: userId }, { members: userId }],
        },
      ],
    };

    const projection = { __v: 0 };

    it('should return the project if found', async () => {
      const mockProject = {
        _id: projectId,
        name: 'Project Test',
        ownerId: userId,
        deleted: false,
      };

      (mockProjectModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      const result = await projectService.findOne(projectId, user);

      expect(mockProjectModel.findOne).toHaveBeenCalledWith(filter, projection);
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      (mockProjectModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        projectService.findOne(projectId, user),
      ).rejects.toThrowError(
        new NotFoundException({
          message: `The project with the id ${projectId} not found`,
          reference: 'PROJECT_NOT_FOUND',
        }),
      );
    });

    it('should rethrow any unexpected error and log it', async () => {
      const error = new Error('Unexpected error');

      (mockProjectModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(error),
      });

      const loggerSpy = jest
        .spyOn(projectService['logger'], 'error')
        .mockImplementation(() => {});

      await expect(projectService.findOne(projectId, user)).rejects.toThrow(
        error,
      );

      expect(loggerSpy).toHaveBeenCalledWith(error);

      loggerSpy.mockRestore();
    });
  });

  describe('update', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const ownerId = '687bf852e1b4c24c8a4af2dc';
    const otherUserId = 'other-user-id';

    const userOwner = { id: ownerId } as User;
    const userNotOwner = { id: otherUserId } as User;

    const updateDto: UpdateProjectDto = {
      name: 'Updated project name',
      description: 'Updated description',
    };

    it('should update and return updated project if user is owner', async () => {
      const existingProject = {
        _id: projectId,
        ownerId: ownerId,
        members: [],
        tasks: [],
      };

      const updatedProject = {
        _id: projectId,
        ownerId: ownerId,
        name: updateDto.name,
        description: updateDto.description,
        members: [],
        tasks: [],
      };

      jest
        .spyOn(projectService, 'findOne')
        .mockResolvedValue(existingProject as any);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedProject),
      };

      (mockProjectModel.findOneAndUpdate as jest.Mock).mockReturnValue(
        mockQuery,
      );

      const result = await projectService.update(
        projectId,
        updateDto,
        userOwner,
      );

      expect(projectService.findOne).toHaveBeenCalledWith(projectId, userOwner);
      expect(mockProjectModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: projectId },
        updateDto,
        { new: true, projection: { __v: 0 } },
      );
      expect(result).toEqual(updatedProject);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const existingProject = {
        _id: projectId,
        ownerId: ownerId,
      };

      jest
        .spyOn(projectService, 'findOne')
        .mockResolvedValue(existingProject as any);

      await expect(
        projectService.update(projectId, updateDto, userNotOwner),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        projectService.update(projectId, updateDto, userNotOwner),
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Only the project owner can update the project.',
        }),
      );
    });

    it('should log and rethrow unexpected errors', async () => {
      const error = new Error('Unexpected error');

      jest.spyOn(projectService, 'findOne').mockRejectedValue(error);

      const loggerSpy = jest
        .spyOn(projectService['logger'], 'error')
        .mockImplementation(() => {});

      await expect(
        projectService.update(projectId, updateDto, userOwner),
      ).rejects.toThrow(error);

      expect(loggerSpy).toHaveBeenCalledWith(error);

      loggerSpy.mockRestore();
    });
  });

  describe('remove', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const ownerId = '687bf852e1b4c24c8a4af2dc';
    const otherUserId = 'other-user-id-456';

    const userOwner = { id: ownerId } as User;
    const userNotOwner = { id: otherUserId } as User;

    const existingProject = {
      _id: projectId,
      ownerId: ownerId,
      deleted: false,
    };

    it('should soft delete project if user is owner', async () => {
      jest
        .spyOn(projectService, 'findOne')
        .mockResolvedValue(existingProject as any);

      const updatedProject = {
        ...existingProject,
        deleted: true,
        deletedAt: new Date(),
      };

      const findOneAndUpdateSpy = jest
        .spyOn(mockProjectModel, 'findOneAndUpdate')
        .mockResolvedValue(updatedProject);

      const result = await projectService.remove(projectId, userOwner);

      expect(projectService.findOne).toHaveBeenCalledWith(projectId, userOwner);
      expect(findOneAndUpdateSpy).toHaveBeenCalledTimes(2);
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { _id: projectId, deleted: false },
        expect.objectContaining({ deleted: true, deletedAt: expect.any(Date) }),
      );

      expect(result).toEqual({ acknowledge: true, deletedCount: 1 });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest
        .spyOn(projectService, 'findOne')
        .mockResolvedValue(existingProject as any);

      await expect(
        projectService.remove(projectId, userNotOwner),
      ).rejects.toThrowError('Only the project owner can delete the project.');
    });

    it('should rethrow error if findOne throws', async () => {
      const error = new Error('Unexpected error');

      jest.spyOn(projectService, 'findOne').mockRejectedValue(error);

      const loggerSpy = jest
        .spyOn(projectService['logger'], 'error')
        .mockImplementation(() => {});

      await expect(projectService.remove(projectId, userOwner)).rejects.toThrow(
        error,
      );

      expect(loggerSpy).toHaveBeenCalledWith(error);

      loggerSpy.mockRestore();
    });
  });

  describe('addMember', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';
    const newMemberId = '687e64a68660f5de28606456';
    const user = { id: userId } as User;

    const mockProject = {
      _id: projectId,
      name: 'Project Test',
      ownerId: userId,
      deleted: false,
      members: [],
    };

    const membersToProjectDto = {
      usersIds: [newMemberId],
    };

    const projectUser = {
      role: ProjectUserRoleEnum.OWNER,
    };
    it('should add new members to the project successfully', async () => {
      jest
        .spyOn(projectService, 'findOne')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(projectUserService, 'findOneByProjectIdAndUserId')
        .mockResolvedValue(projectUser as any);
      jest
        .spyOn(projectUserService, 'existsByProjectIdAndUserId')
        .mockResolvedValue(false);
      jest
        .spyOn(projectUserService, 'createMany')
        .mockResolvedValue([newMemberId]);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ updated: true }),
      };

      jest
        .spyOn(projectModel, 'findOneAndUpdate')
        .mockReturnValue(mockQuery as any);

      const result = await projectService.addMembersToProject(
        projectId,
        membersToProjectDto,
        user,
      );

      expect(result).toEqual({ updated: true });

      expect(projectService.findOne).toHaveBeenCalledWith(projectId, user);
      expect(
        projectUserService.findOneByProjectIdAndUserId,
      ).toHaveBeenCalledWith(projectId, userId);
      expect(
        projectUserService.existsByProjectIdAndUserId,
      ).toHaveBeenCalledWith(projectId, newMemberId);
      expect(projectUserService.createMany).toHaveBeenCalledWith([
        {
          projectId,
          userId: newMemberId,
          role: ProjectUserRoleEnum.MEMBER,
        },
      ]);
      expect(projectModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should throw if all users are already project members', async () => {
      const user = { id: userId } as User;
      const membersToProjectDto = {
        usersIds: [newMemberId],
      };

      const project = {
        _id: projectId,
        members: [newMemberId],
      };

      jest.spyOn(projectService, 'findOne').mockResolvedValue(project as any);

      await expect(
        projectService.addMembersToProject(
          projectId,
          membersToProjectDto,
          user,
        ),
      ).rejects.toThrowError('The users are already project members');

      expect(projectService.findOne).toHaveBeenCalledWith(projectId, user);
    });

    it('should throw if the user is not the project owner', async () => {
      const user = { id: userId } as User;
      const membersToProjectDto = {
        usersIds: ['user789'],
      };

      const project = {
        _id: projectId,
        members: [],
      };

      const projectUser = {
        role: ProjectUserRoleEnum.MEMBER,
      };

      jest.spyOn(projectService, 'findOne').mockResolvedValue(project as any);
      jest
        .spyOn(projectUserService, 'findOneByProjectIdAndUserId')
        .mockResolvedValue(projectUser as any);

      await expect(
        projectService.addMembersToProject(
          projectId,
          membersToProjectDto,
          user,
        ),
      ).rejects.toThrowError('Only the project owner can add members');

      expect(projectService.findOne).toHaveBeenCalledWith(projectId, user);
      expect(
        projectUserService.findOneByProjectIdAndUserId,
      ).toHaveBeenCalledWith(projectId, userId);
    });
  });

  describe('removeMember', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const ownerId = '687bf852e1b4c24c8a4af2dc';
    const memberId = '687e64a68660f5de28606456';

    const mockProject = { _id: projectId, id: projectId };
    const mockOwnerProjectUser = { role: ProjectUserRoleEnum.OWNER };
    const mockMemberProjectUser = { _id: 'pu123', userId: memberId };
    const mockTasks = [{ _id: 'task1' }, { _id: 'task2' }];
    const mockUpdatedProject = { _id: projectId, members: [], tasks: [] };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should remove a member from the project and reassign tasks', async () => {
      jest
        .spyOn(projectService, 'findOne')
        .mockResolvedValue(mockProject as any);

      const validateSpy = jest
        .spyOn(projectService, 'validateAndGetProjectUser')
        .mockImplementation((_, userIdArg) => {
          if (userIdArg === ownerId)
            return Promise.resolve(mockOwnerProjectUser as any);
          if (userIdArg === memberId)
            return Promise.resolve(mockMemberProjectUser as any);
          return Promise.reject(new Error('Invalid user'));
        });

      jest.spyOn(taskModel, 'find').mockImplementation(
        () =>
          ({
            exec: jest.fn().mockResolvedValue(mockTasks),
          }) as any,
      );

      const updateManySpy = jest
        .spyOn(taskModel, 'updateMany')
        .mockResolvedValue({} as any);
      const updateProjectUserSpy = jest
        .spyOn(projectUserModel, 'updateOne')
        .mockResolvedValue({} as any);

      const findOneAndUpdateSpy = jest
        .spyOn(projectModel, 'findOneAndUpdate')
        .mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockUpdatedProject),
        } as any);

      const result = await projectService.removeMember(projectId, memberId, {
        id: ownerId,
      } as User);

      expect(validateSpy).toHaveBeenCalledWith(projectId, ownerId);
      expect(validateSpy).toHaveBeenCalledWith(projectId, memberId);

      expect(updateManySpy).toHaveBeenCalledWith(
        { _id: { $in: ['task1', 'task2'] } },
        { $set: { assignedUserId: ownerId, projectId } },
      );

      expect(updateProjectUserSpy).toHaveBeenCalledWith(
        { _id: 'pu123' },
        { $set: { deleted: true, deletedAt: expect.any(Date) } },
      );

      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { _id: projectId, deleted: false },
        { $pull: { members: memberId } },
        { new: true, projection: { __v: 0 } },
      );

      expect(result).toEqual(mockUpdatedProject);
    });
  });
});
