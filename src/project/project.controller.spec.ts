import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { User } from '../auth/entities/user.entity';
import { PaginationDto } from '../common';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { MembersToProjectDto } from './dto/members-to-project.dto';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;

  beforeEach(async () => {
    const mockProjectService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOneWithPopulate: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addMembersToProject: jest.fn(),
      removeMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    projectController = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(projectController).toBeDefined();
  });

  const userId = '64ab1234567890abcdef9874';
  const projectId = '64ab1234567890abcdef1234';
  const user = { id: userId } as User;

  describe('create', () => {
    it('should call projectService.create with correct DTO and user', async () => {
      const createProjectDto = {
        name: 'New Project',
        description: 'desc',
      } as CreateProjectDto;
      const user = { id: userId } as User;

      await projectController.create(createProjectDto, user);

      expect(projectService.create).toHaveBeenCalledWith(
        createProjectDto,
        user,
      );
    });
  });

  describe('findAll', () => {
    it('should call projectService.findAll with correct pagination and user', async () => {
      const paginationDto = { page: 1, limit: 5 } as PaginationDto;
      const user = { id: userId } as User;

      await projectController.findAll(paginationDto, user);

      expect(projectService.findAll).toHaveBeenCalledWith(paginationDto, user);
    });
  });

  describe('findOne', () => {
    it('should call projectService.findOneWithPopulate with correct id and user', async () => {
      await projectController.findOne(projectId, user);
      expect(projectService.findOneWithPopulate).toHaveBeenCalledWith(
        projectId,
        user,
      );
    });
  });

  describe('update', () => {
    it('should call projectService.update with correct id, dto, and user', async () => {
      const updateProjectDto = {
        name: 'Updated Project Name',
      } as UpdateProjectDto;
      await projectController.update(projectId, updateProjectDto, user);
      expect(projectService.update).toHaveBeenCalledWith(
        projectId,
        updateProjectDto,
        user,
      );
    });
  });

  describe('remove', () => {
    it('should call projectService.remove with correct id and user', async () => {
      await projectController.remove(projectId, user);
      expect(projectService.remove).toHaveBeenCalledWith(projectId, user);
    });
  });

  describe('addMembers', () => {
    it('should call projectService.addMembersToProject with correct params', async () => {
      const membersToProjectDto = {
        usersIds: ['member1', 'member2'],
      } as MembersToProjectDto;

      await projectController.addMembers(projectId, user, membersToProjectDto);

      expect(projectService.addMembersToProject).toHaveBeenCalledWith(
        projectId,
        membersToProjectDto,
        user,
      );
    });
  });

  describe('removeMember', () => {
    it('should call projectService.removeMember with correct params', async () => {
      const memberId = '64bc234567890abcdef12345';
      await projectController.removeMember(projectId, memberId, user);
      expect(projectService.removeMember).toHaveBeenCalledWith(
        projectId,
        memberId,
        user,
      );
    });
  });
});
