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
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { Auth, GetUser } from '../auth/decorators';
import { UserRoleEnum } from '../auth/constants/user-role.enum';
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
import { Task } from './entities';
import { User } from '../auth/entities/user.entity';

@Controller('tasks')
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Create a new Task',
  })
  @ApiResponse({
    status: 201,
    description: 'Task was created',
    type: Task,
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
  create(@Body() createTaskDto: CreateTaskDto, @GetUser() user: User) {
    return this.taskService.create(createTaskDto, user);
  }

  @Get()
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Retrieve a list of Tasks with pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Get Tasks',
    type: PaginationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: FORBIDDEN_EXAMPLE,
  })
  findAll(@Query() paginationDto: PaginationDto, @GetUser() user: User) {
    return this.taskService.findAll(paginationDto, user);
  }

  @Get(':id')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Get Task by id',
  })
  @ApiResponse({ status: 200, description: 'Get Task by Id', type: Task })
  @ApiResponse({
    status: 404,
    description: 'Task Not Found',
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
  async findOne(
    @Param('id', new ValidateMongoIdPipe()) id: string,
    @GetUser() user: User,
  ) {
    const task = await this.taskService.findOneWithPopulate(id, user);
    await this.taskService.validateAndGetProjectUser(task.projectId, user.id);
    return task;
  }

  @Patch(':id')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Update Task',
  })
  @ApiResponse({
    status: 200,
    description: 'Update Task Successfully',
    type: Task,
  })
  @ApiResponse({
    status: 404,
    description: 'Task Not Found',
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
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ) {
    return this.taskService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @Auth(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Delete Task',
  })
  @ApiResponse({
    status: 200,
    description: 'Delete Task Successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task Not Found',
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
    return this.taskService.remove(id, user);
  }
}
