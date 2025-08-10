import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { envs } from '../src/config';

let mongoDBContainer: StartedTestContainer | null = null;
let mongoUri: string;

/**
 * Starts a MongoDB TestContainer if it is not already started.
 *
 * @returns {Promise<string>} - The connection URI for the MongoDB test database.
 */
export async function startMongoTestContainer(): Promise<string> {
  if (!mongoDBContainer) {
    console.log('Starting MongoDB TestContainer...');

    mongoDBContainer = await new GenericContainer('mongo:6.0.1')
     .withExposedPorts(27017)
      .start();
  }

  const port = mongoDBContainer.getMappedPort(27017);
  const host = mongoDBContainer.getHost();

  mongoUri = `mongodb://${host}:${port}/testProjectManagementDB`;
  process.env.DATABASE_URL = mongoUri;
  envs.databaseUrl = mongoUri;
  console.log(`MongoDB TestContainer started at ${mongoUri}`);
  return mongoUri;
}

export async function stopMongoTestContainer() {
  if (mongoDBContainer) {
    await mongoDBContainer.stop();
    mongoDBContainer = null;
    console.log('MongoDBTestContainer stopped.');
  }
}