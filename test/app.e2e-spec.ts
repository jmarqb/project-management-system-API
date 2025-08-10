import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import {
  startMongoTestContainer,
  stopMongoTestContainer,
} from './test-helpers';
import { MongooseModule } from '@nestjs/mongoose';

describe('AppController (e2e)', () => {
  let app: INestApplication;

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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopMongoTestContainer();
  });

  it('/ (GET)', () => {
    console.log('test-e2e-init');
  });
});
