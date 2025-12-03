import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: { id: number; email: string };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  beforeEach(async () => {
    // Clean up test data - delete in correct order to avoid foreign key constraints
    await prisma.submission.deleteMany({ where: { user: { email: { startsWith: 'test@' } } } });
    await prisma.lesson.deleteMany({ where: { author: { email: { startsWith: 'test@' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test@' } } });
  });

  afterAll(async () => {
    await prisma.submission.deleteMany({ where: { user: { email: { startsWith: 'test@' } } } });
    await prisma.lesson.deleteMany({ where: { author: { email: { startsWith: 'test@' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test@' } } });
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(dto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      const user = await prisma.user.findUnique({ where: { email: dto.email } });
      expect(user).toBeDefined();
      expect(user?.firstName).toBe(dto.firstName);
    });

    it('should reject duplicate email', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app.getHttpServer()).post('/api/auth/register').send(dto).expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(dto)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Clean up first
      await prisma.user.deleteMany({ where: { email: 'test@example.com' } });

      const hashedPassword = await bcrypt.hash('Test123!', 12);
      const role = await prisma.role.upsert({
        where: { name: 'STUDENT' },
        update: {},
        create: { name: 'STUDENT' }
      });

      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          roleId: role.id
        }
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!'
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      const role = await prisma.role.upsert({
        where: { name: 'STUDENT' },
        update: {},
        create: { name: 'STUDENT' }
      });

      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          roleId: role.id
        }
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // /api/auth/me returns JWT payload, not full user object
      expect(response.body).toHaveProperty('sub');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('role', 'STUDENT');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });
});

