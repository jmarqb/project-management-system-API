import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getModelToken } from '@nestjs/mongoose';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'secret-key',
          signOptions: { expiresIn: '2h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: JwtStrategy,
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
      ],
    }).compile();
  });

  beforeEach(() => {
    module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AuthService as provider', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should have AuthController as controller', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should have JwtStrategy as provider', () => {
    const provider = module.get<JwtStrategy>(JwtStrategy);
    expect(provider).toBeDefined();
  });

  it('should have JwtModule as module', () => {
    const jwtModule = module.get<JwtModule>(JwtModule);
    expect(jwtModule).toBeDefined();
  });
});