import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { envs } from './config';
import { ProjectModule } from './project/project.module';
import { ProjectUserModule } from './project-user/project-user.module';
import { TaskModule } from './task/task.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { CacheInterceptor, CacheModule } from "@nestjs/cache-manager";
import { createKeyv, Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { APP_INTERCEPTOR } from "@nestjs/core";

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        let store;

        if (envs.app_cache_store?.toLowerCase() === 'redis') {
          const host = envs.app_cache_host ?? '127.0.0.1';
          const port = envs.app_cache_port ?? 6379;
          store = createKeyv(`redis://${host}:${port}`);
        }
        else {
          store = new Keyv({
            store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
          });
        }

        return {
          store: store,
        };
      },
    }),

    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: envs.databaseUrl,
        autoCreate: true,
      }),
    }),
    ProjectModule,
    ProjectUserModule,
    TaskModule,
    CommonModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
