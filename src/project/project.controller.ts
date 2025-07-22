import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { Auth, GetUser } from '../auth/decorators';
import { UserRoleEnum } from '../auth/constants/user-role.enum';
import { User } from '../auth/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BAD_REQUEST_EXAMPLE,
  DeleteResponseDto,
  ENTITY_NOT_FOUND_EXAMPLE,
  FORBIDDEN_EXAMPLE,
  PaginationDto,
  PaginationResponseDto,
  ValidateMongoIdPipe,
} from '../common';
import { Project } from './entities';
import { MembersToProjectDto } from './dto/members-to-project.dto';

@Controller('projects')
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Create a new Project',
  })
  @ApiResponse({
    status: 201,
    description: 'Project was created',
    type: Project,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BAD_REQUEST_EXAMPLE,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  create(@Body() createProjectDto: CreateProjectDto, @GetUser() user: User) {
    return this.projectService.create(createProjectDto, user);
  }

  @Get()
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Retrieve a list of projects with pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Get Projects',
    type: PaginationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  findAll(@Query() paginationDto: PaginationDto, @GetUser() user: User) {
    return this.projectService.findAll(paginationDto, user);
  }

  @Get(':id')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Get project by id',
  })
  @ApiResponse({ status: 200, description: 'Get Project by Id', type: Project })
  @ApiResponse({
    status: 404,
    description: 'Project Not Found',
    type: ENTITY_NOT_FOUND_EXAMPLE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BAD_REQUEST_EXAMPLE,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  findOne(
    @Param('id', new ValidateMongoIdPipe()) id: string,
    @GetUser() user: User,
  ) {
    return this.projectService.findOneWithPopulate(id, user);
  }

  @Patch(':id')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Update project',
  })
  @ApiResponse({
    status: 200,
    description: 'Update Project Successfully',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Project Not Found',
    type: ENTITY_NOT_FOUND_EXAMPLE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BAD_REQUEST_EXAMPLE,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  update(
    @Param('id', new ValidateMongoIdPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() user: User,
  ) {
    return this.projectService.update(id, updateProjectDto, user);
  }

  @Delete(':id')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Delete project',
  })
  @ApiResponse({
    status: 200,
    description: 'Delete Project Successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project Not Found',
    type: ENTITY_NOT_FOUND_EXAMPLE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BAD_REQUEST_EXAMPLE,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  remove(
    @Param('id', new ValidateMongoIdPipe()) id: string,
    @GetUser() user: User,
  ) {
    return this.projectService.remove(id, user);
  }

  @Post(':projectId/members')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Add members to Project',
  })
  @ApiResponse({
    status: 201,
    description: 'Add Members Successfully',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Project Not Found',
    type: ENTITY_NOT_FOUND_EXAMPLE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BAD_REQUEST_EXAMPLE,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  addMembers(
    @Param('projectId', new ValidateMongoIdPipe()) projectId: string,
    @GetUser() user: User,
    @Body() membersToProjectDto: MembersToProjectDto,
  ) {
    return this.projectService.addMembersToProject(
      projectId,
      membersToProjectDto,
      user,
    );
  }

  @Delete(':projectId/members/:memberId')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Remove member from Project',
  })
  @ApiResponse({
    status: 200,
    description: 'Remove Member Successfully',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Project Not Found',
    type: ENTITY_NOT_FOUND_EXAMPLE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BAD_REQUEST_EXAMPLE,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  removeMember(
    @Param('projectId', new ValidateMongoIdPipe()) projectId: string,
    @Param('memberId', new ValidateMongoIdPipe()) memberId: string,
    @GetUser() user: User,
  ) {
    return this.projectService.removeMember(projectId, memberId, user);
  }
}
