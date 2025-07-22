import { Test, TestingModule } from '@nestjs/testing';
import { ProjectUserService } from './project-user.service';
import { Model } from 'mongoose';
import { ProjectUser } from './entities';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectUserRoleEnum } from './constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProjectUserDto } from './dto/create-project-user.dto';

describe('ProjectUserService', () => {
  let projectUserService: ProjectUserService;
  let projectUserModel: Model<ProjectUser>;

  const mockProjectUserModel = {
    create: jest.fn(),
    insertMany: jest.fn(),
    findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
    exists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(ProjectUser.name),
          useValue: mockProjectUserModel,
        },
        ProjectUserService,
      ],
    }).compile();

    projectUserService = module.get<ProjectUserService>(ProjectUserService);
    projectUserModel = module.get<Model<ProjectUser>>(
      getModelToken('ProjectUser'),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(projectUserService).toBeDefined();
  });

  describe('create', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';

    it('should create a project user successfully', async () => {
      const dto = {
        projectId: projectId,
        userId: userId,
        role: ProjectUserRoleEnum.MEMBER,
      };

      const mockCreated = {
        toObject: jest.fn().mockReturnValue({ ...dto, _id: 'mockId' }),
      };

      mockProjectUserModel.create.mockResolvedValue(mockCreated);

      const result = await projectUserService.create(dto);

      expect(mockProjectUserModel.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ ...dto, _id: 'mockId' });
    });

    it('should throw BadRequestException when missing fields', async () => {
      const incompleteDto = {
        userId: userId,
        role: ProjectUserRoleEnum.OWNER,
      };

      await expect(
        projectUserService.create(incompleteDto as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        projectUserService.create(incompleteDto as any),
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Missing required fields: projectId, userId, or role',
        }),
      );
    });

    it('should propagate other errors', async () => {
      const dto = {
        projectId: projectId,
        userId: userId,
        role: ProjectUserRoleEnum.MEMBER,
      };

      const error = new Error('DB error');
      mockProjectUserModel.create.mockRejectedValue(error);

      await expect(projectUserService.create(dto)).rejects.toThrow('DB error');
    });
  });

  describe('createMany', () => {
    it('should throw BadRequestException if any dto is missing required fields', async () => {
      const invalidDtos: CreateProjectUserDto[] = [
        { projectId: '', userId: '', role: null },
      ] as unknown as CreateProjectUserDto[];

      await expect(projectUserService.createMany(invalidDtos)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should insert many project users and return their userIds', async () => {
      const userId1 = '687bf852e1b4c24c8a4af2dc';
      const userId2 = '687e64a68660f5de28606fe0';
      const projectId = '687bf852e1b4c24c8a4a002l';
      const dtos: CreateProjectUserDto[] = [
        {
          projectId: projectId,
          userId: userId1,
          role: 'MEMBER',
        },
        {
          projectId: projectId,
          userId: userId2,
          role: 'MEMBER',
        },
      ] as unknown as CreateProjectUserDto[];

      mockProjectUserModel.insertMany.mockResolvedValueOnce([
        { userId: userId1 },
        { userId: userId2 },
      ]);

      const result = await projectUserService.createMany(dtos);

      expect(mockProjectUserModel.insertMany).toHaveBeenCalledWith(dtos);
      expect(result).toEqual([userId1, userId2]);
    });
  });

  describe('findOneByProjectIdAndUserId', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';
    const projectUserId = '687bf852e1b4c24c8a4a0001';

    const mockProjectUser = {
      _id: projectUserId,
      projectId: projectId,
      userId: userId,
      role: 'MEMBER',
      deleted: false,
    };
    it('should return the project user if found', async () => {
      (projectUserModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProjectUser),
      });

      const result = await projectUserService.findOneByProjectIdAndUserId(
        projectId,
        userId,
      );

      expect(projectUserModel.findOne).toHaveBeenCalledWith(
        { deleted: false, projectId: projectId, userId: userId },
        { __v: 0 },
      );
      expect(result).toEqual(mockProjectUser);
    });

    it('should throw NotFoundException if no project user is found', async () => {
      (projectUserModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        projectUserService.findOneByProjectIdAndUserId(projectId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('existsByProjectIdAndUserId', () => {
    const projectId = '687e64a68660f5de28606fe0';
    const userId = '687bf852e1b4c24c8a4af2dc';

    it('should return true if a record exists', async () => {
      jest
        .spyOn(projectUserModel, 'exists')
        .mockResolvedValueOnce({ _id: 'any id' } as any);

      const result = await projectUserService.existsByProjectIdAndUserId(
        projectId,
        userId,
      );

      expect(result).toBe(true);
      expect(projectUserModel.exists).toHaveBeenCalledWith({
        deleted: false,
        projectId,
        userId,
      });
    });

    it('should return false if no record exists', async () => {
      jest.spyOn(projectUserModel, 'exists').mockResolvedValueOnce(null);

      const result = await projectUserService.existsByProjectIdAndUserId(
        projectId,
        userId,
      );

      expect(result).toBe(false);
    });

    it('should log and throw any unexpected error', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(projectUserModel, 'exists').mockRejectedValueOnce(error);

      await expect(
        projectUserService.existsByProjectIdAndUserId(projectId, userId),
      ).rejects.toThrow(error);
    });
  });
});
