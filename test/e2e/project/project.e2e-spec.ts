import {
  startMongoTestContainer,
  stopMongoTestContainer,
} from '../../test-helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { AppModule } from '../../../src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from '../../../src/project/dto';
import * as request from 'supertest';
import mongoose, { Model } from 'mongoose';
import { User } from '../../../src/auth/entities/user.entity';
import { DeleteResponseDto } from '../../../src/common';
import { MembersToProjectDto } from '../../../src/project/dto/members-to-project.dto';

const testingUser = {
  firstName: 'Testing',
  lastName: 'User',
  email: 'testing.user@gmail.com',
  password: 'Abc123',
};

describe('ProjectController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const mongoUri = await startMongoTestContainer();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri, {
          autoCreate: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
      }),
    );

    await app.init();

    userModel = app.get<Model<User>>(getModelToken('User'));
  });

  beforeEach(async () => {
    await userModel.deleteOne({
      email: testingUser.email,
    });

    const registerUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingUser);

    userToken = registerUserResponse.body.token;
    userId = registerUserResponse.body.user._id;
  });

  afterAll(async () => {
    await app.close();
    await stopMongoTestContainer();
  });

  describe('/projects (POST)', () => {
    it('/projects POST should Unauthorized if not exist token', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .send(dto);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('/projects POST should Forbidden if user not have a valid role', async () => {
      await userModel.updateOne(
        {
          email: testingUser.email,
        },
        { roles: ['OTHER_ROLE'] },
      );

      await request(app.getHttpServer()).post('/auth/login').send({
        email: testingUser.email,
        password: testingUser.password,
      });

      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'User Testing need a valid role: [USER,ADMIN]',
        error: 'Forbidden',
        statusCode: 403,
      });
    });

    it('/projects POST should create project', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: 'Test Project',
        description: 'Test Project',
        archived: false,
        ownerId: userId,
        members: [],
        tasks: [],
        deleted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('/projects (GET)', () => {
    it('should respond with paginated projects', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body).toMatchObject({
        items: [
          expect.objectContaining({
            name: 'Test Project',
            description: 'Test Project',
            archived: false,
            ownerId: userId,
            members: [],
            tasks: [],
            deleted: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(String),
          }),
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1,
      });
    });

    it('/projects GET should Forbidden if user not have a valid role', async () => {
      await userModel.updateOne(
        {
          email: testingUser.email,
        },
        { roles: ['OTHER_ROLE'] },
      );

      await request(app.getHttpServer()).post('/auth/login').send({
        email: testingUser.email,
        password: testingUser.password,
      });

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'User Testing need a valid role: [USER,ADMIN]',
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  describe('/projects/:id (GET)', () => {
    it('should retrieve a project by id', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      const createdProject = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      const { id } = createdProject.body;

      const response = await request(app.getHttpServer())
        .get(`/projects/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'Test Project',
        description: 'Test Project',
        archived: false,
        ownerId: userId,
        members: [],
        tasks: [],
        deleted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return bad request if id is not a valid mongoId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/Invalid-Mongo-Id`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Invalid MongoId',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('should return Not found if project not exists', async () => {
      const nonExistId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer())
        .get(`/projects/${nonExistId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `The project with the id ${nonExistId} not found`,
        reference: 'PROJECT_NOT_FOUND',
      });
    });
  });

  describe('/projects/:id (PATCH)', () => {
    it('should update a existent project', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      const createdProject = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      const { id } = createdProject.body;

      const updateDto: UpdateProjectDto = {
        name: 'Updated Name of Project',
        description: 'Test Project',
        archived: true,
      };

      const response = await request(app.getHttpServer())
        .patch(`/projects/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        name: updateDto.name,
        description: updateDto.description,
        archived: updateDto.archived,
        ownerId: userId,
        members: [],
        tasks: [],
        deleted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id,
      });
    });

    it('should return a bad request if id is not a valid mongoID', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/projects/Invalid-Mongo-Id`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Invalid MongoId',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('should return Not found if project to update not exists', async () => {
      const nonExistId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer())
        .patch(`/projects/${nonExistId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `The project with the id ${nonExistId} not found`,
        reference: 'PROJECT_NOT_FOUND',
      });
    });

    it('should return unauthorized if token not exists', async () => {
      const nonExistId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer())
        .patch(`/projects/${nonExistId}`)
        .send();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('/projects PATCH should Forbidden if user not have a valid role', async () => {
      await userModel.updateOne(
        {
          email: testingUser.email,
        },
        { roles: ['OTHER_ROLE'] },
      );

      await request(app.getHttpServer()).post('/auth/login').send({
        email: testingUser.email,
        password: testingUser.password,
      });

      const projectId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'User Testing need a valid role: [USER,ADMIN]',
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  describe('/projects/:id (DELETE)', () => {
    it('should return a bad request if id is not a valid mongoID', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/projects/Invalid-Mongo-Id`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual({
        message: 'Invalid MongoId',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should return Not found if project to delete not exists', async () => {
      const nonExistId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer())
        .delete(`/projects/${nonExistId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(response.body).toEqual({
        message: `The project with the id ${nonExistId} not found`,
        reference: 'PROJECT_NOT_FOUND',
      });
    });

    it('should return unauthorized if token not exists', async () => {
      const nonExistId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer())
        .delete(`/projects/${nonExistId}`)
        .send();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should delete a project', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      const createdProject = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      const { id } = createdProject.body;

      const deleteDto: DeleteResponseDto = {
        acknowledge: true,
        deletedCount: 1,
      };

      const response = await request(app.getHttpServer())
        .delete(`/projects/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(deleteDto);
    });
  });

  describe('/projects/:projectId/members', () => {
    it('should add member to project', async () => {
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      const createdProject = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      const projectId = createdProject.body.id;

      const newUser = {
        firstName: 'newTesting',
        lastName: 'User',
        email: 'newtesting.user@gmail.com',
        password: 'Abc123',
      };

      const registerNewUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser);

      const memberId = registerNewUserResponse.body.user._id.toString();
      const memberDto: MembersToProjectDto = {
        usersIds: [memberId],
      };

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(memberDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        name: dto.name,
        description: dto.description,
        archived: false,
        ownerId: userId,
        members: [
          {
            _id: memberId,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
          },
        ],
        tasks: [],
        deleted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: createdProject.body.id,
      });
    });
  });

  describe('/projects/:projectId/members/:memberId (DELETE)', () => {
    it('should remove a member from project', async () => {
      //Arrange
      //First: create a project and insert a new User to become a member
      const dto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Project',
      };
      const createdProject = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dto);

      const projectId = createdProject.body.id;

      const newUser = {
        firstName: 'newTesting',
        lastName: 'User',
        email: 'othertesting.user@gmail.com',
        password: 'Abc123',
      };

      const registerNewUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser);

      const memberId = registerNewUserResponse.body.user._id.toString();
      const memberDto: MembersToProjectDto = {
        usersIds: [memberId],
      };

      const responseToAddingMember = await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(memberDto);

      expect(responseToAddingMember.body).toMatchObject({
        name: dto.name,
        description: dto.description,
        archived: false,
        ownerId: userId,
        members: [
          {
            _id: memberId,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
          },
        ],
        tasks: [],
        deleted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: createdProject.body.id,
      });

      // remove a member
      // ACT
      const response = await request(app.getHttpServer())
        .delete(`/projects/${projectId}/members/${memberId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      // ASSERT
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        name: dto.name,
        description: dto.description,
        archived: false,
        ownerId: userId,
        members: [],
        tasks: [],
        deleted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: createdProject.body.id,
      });
    });
  });
});
