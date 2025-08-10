import { INestApplication, ValidationPipe } from '@nestjs/common';
import { startMongoTestContainer, stopMongoTestContainer, } from '../../test-helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { AppModule } from '../../../src/app.module';
import * as request from 'supertest';
import { CreateUserDto } from '../../../src/auth/dto';

describe('Auth - Register', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(await startMongoTestContainer(), {
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
  });

  afterAll(async () => {
    await app.close();
    await stopMongoTestContainer();
  });

  it('/auth/register (POST) - should throw 400 if no body', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send();

    const errorMessages =  [
      'firstName must be shorter than or equal to 60 characters',
      'firstName must be longer than or equal to 3 characters',
      'firstName should not be empty',
      'firstName must be a string',
      'lastName must be shorter than or equal to 60 characters',
      'lastName must be longer than or equal to 3 characters',
      'lastName should not be empty',
      'lastName must be a string',
      'email must be a string',
      'email should not be empty',
      'email must be an email',
      'The password must have a Uppercase, lowercase letter and a number',
      'password should not be empty',
      'password must be shorter than or equal to 50 characters',
      'password must be longer than or equal to 6 characters',
      'password must be a string'
    ];

    expect(response.status).toBe(400);
    errorMessages.forEach((message) => {
      expect(response.body.message).toContain(message);
    });

  });
  it('/auth/register (POST) - should create user successfully',async () => {
    const dto:CreateUserDto ={
      firstName: 'John',
      lastName: 'Doe',
      email: 'hYUkR@example.com',
      password: 'Abc123',
    }
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto);
    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toEqual(dto.email);
    expect(response.body.user.firstName).toEqual(dto.firstName);
    expect(response.body.user.lastName).toEqual(dto.lastName);
    expect(response.body.user.roles).toBeInstanceOf(Array);
    expect(response.body.user.roles).toContain('USER');
  });
});
