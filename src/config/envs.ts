import 'dotenv/config';
import * as process from 'process';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_CACHE_STORE: string;
  APP_CACHE_HOST: string;
  APP_CACHE_PORT: number;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),

    // CACHING - BY DEFAULT USE CACHEABLE-MEMORY IF YOU WANT TO USE REDIS SET THE CORRECT VALUES in the env
    APP_CACHE_STORE: joi.string().default('NONE'),
    APP_CACHE_HOST: joi.string().default('NONE'),
    APP_CACHE_PORT: joi.number(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  APP_CACHE_STORE: process.env.APP_CACHE_STORE,
  APP_CACHE_HOST: process.env.APP_CACHE_HOST,
  APP_CACHE_PORT: process.env.APP_CACHE_PORT,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  jwt_secret: envVars.JWT_SECRET,
  app_cache_store: envVars.APP_CACHE_STORE,
  app_cache_host: envVars.APP_CACHE_HOST,
  app_cache_port: envVars.APP_CACHE_PORT,
};
