import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Model } from 'mongoose';
import { User } from '../../../src/auth/entities/user.entity';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { UserRoleEnum } from '../../../src/auth/constants/user-role.enum';
import {
  startMongoTestContainer,
  stopMongoTestContainer,
} from '../../test-helpers';
import 'dotenv/config';

const testingUser = {
  firstName: 'Testing',
  lastName: 'User',
  email: 'testing.user@gmail.com',
  password: 'Abc123',
};

const testingAdminUser = {
  firstName: 'TestingAdmin',
  lastName: 'User',
  email: 'testing.admin.user@gmail.com',
  password: 'Abc123',
};

describe('Auth - Login', () => {
  let app: INestApplication;
  let userModel: Model<User>;

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

    await userModel.deleteMany({
      email: { $in: [testingUser.email, testingAdminUser.email] },
    });

    await request(app.getHttpServer()).post('/auth/register').send(testingUser);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingAdminUser);

    await userModel.updateOne(
      { email: testingAdminUser.email },
      { $addToSet: { roles: [UserRoleEnum.ADMIN] } },
    );
  });

  afterAll(async () => {
    await app.close();
    await stopMongoTestContainer();
  });

  it('/auth/login (POST) - should throw 400 if no body', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send();

    const errorMessages = [
      'email must be a string',
      'email should not be empty',
      'email must be an email',
      'The password must have a Uppercase, lowercase letter and a number',
      'password should not be empty',
      'password must be shorter than or equal to 50 characters',
      'password must be longer than or equal to 6 characters',
      'password must be a string',
    ];

    expect(response.status).toBe(400);
    errorMessages.forEach((message) => {
      expect(response.body.message).toContain(message);
    });
  });

  it('/auth/login (POST) - wrong credentials - email', async () => {
    const loginDto = {
      email: 'wrong.email@test.com',
      password: testingUser.password,
    };
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Credentials or email are not valid',
      reference: 'UNAUTHORIZED',
    });
  });

  it('/auth/login (POST) - wrong credentials - password', async () => {
    const loginDto = {
      email: testingUser.email,
      password: 'Wr5ongpassword',
    };
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Credentials or email are not valid',
      reference: 'UNAUTHORIZED',
    });
  });
  it('/auth/login (POST) - bad request - password', async () => {
    const loginDto = {
      email: testingUser.email,
      password: 'wrongpassword',
    };
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto);
    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: [
          'The password must have a Uppercase, lowercase letter and a number',
        ],
      }),
    );
  });
  it('/auth/login (POST) - valid credentials', async () => {
    const loginDto = {
      email: testingUser.email,
      password: testingUser.password,
    };
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto);

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.token).toEqual(expect.any(String));
  });
});
