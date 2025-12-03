import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Submissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: number;
  let quizId: number;

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
    // Setup test user
    const hashedPassword = await bcrypt.hash('Test123!', 12);
    const role = await prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT' }
    });

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        roleId: role.id
      }
    });
    userId = user.id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });
    accessToken = loginResponse.body.accessToken;

    // Create test lesson and quiz
    const lesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson',
        description: 'Test',
        content: 'Test',
        difficulty: 'BEGINNER',
        tags: [],
        authorId: user.id
      }
    });

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: lesson.id,
        title: 'Test Quiz',
        description: 'Test',
        timeLimit: 30,
        questions: {
          create: [
            {
              prompt: 'What is 2+2?',
              type: 'MULTIPLE_CHOICE',
              options: ['2', '3', '4', '5'],
              answerKey: '4',
              explanation: '2+2 equals 4'
            }
          ]
        }
      },
      include: { questions: true }
    });
    quizId = quiz.id;
  });

  afterEach(async () => {
    // Clean up in correct order
    if (quizId) {
      await prisma.submission.deleteMany({ where: { quizId } });
      await prisma.quizQuestion.deleteMany({ where: { quizId } });
      await prisma.quiz.deleteMany({ where: { id: quizId } });
    }
    if (userId) {
      await prisma.submission.deleteMany({ where: { userId } });
      await prisma.lesson.deleteMany({ where: { authorId: userId } });
      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (e) {
        // User might already be deleted
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/quizzes/:id/submit', () => {
    it('should submit quiz and award XP', async () => {
      // Get the actual question ID from the quiz
      const quizWithQuestions = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true }
      });
      const questionId = quizWithQuestions?.questions[0]?.id;
      if (!questionId) throw new Error('Question not found');

      const response = await request(app.getHttpServer())
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          answers: [{ questionId, answer: '4' }]
        })
        .expect(201);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('xpGain');
      expect(response.body.score).toBeGreaterThan(0);

      // Verify submission was created
      const submission = await prisma.submission.findFirst({
        where: { userId, quizId }
      });
      expect(submission).toBeDefined();
    });

    it('should handle incorrect answers', async () => {
      // Get the actual question ID from the quiz
      const quizWithQuestions = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true }
      });
      const questionId = quizWithQuestions?.questions[0]?.id;

      const response = await request(app.getHttpServer())
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          answers: [{ questionId, answer: '5' }]
        })
        .expect(201);

      expect(response.body.score).toBe(0);
    });

    it('should reject submission without authentication', async () => {
      // Get the actual question ID from the quiz
      const quizWithQuestions = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true }
      });
      const questionId = quizWithQuestions?.questions[0]?.id;

      await request(app.getHttpServer())
        .post(`/api/quizzes/${quizId}/submit`)
        .send({
          answers: [{ questionId, answer: '4' }]
        })
        .expect(401);
    });
  });

  describe('GET /api/submissions/me', () => {
    it('should return user submissions', async () => {
      // Get the actual question ID from the quiz
      const quizWithQuestions = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true }
      });
      const questionId = quizWithQuestions?.questions[0]?.id;
      if (!questionId) throw new Error('Question not found');

      // Create a submission first
      await prisma.submission.create({
        data: {
          userId,
          quizId,
          type: 'QUIZ',
          answers: [{ questionId, answer: '4' }] as any,
          score: 1,
          maxScore: 1,
          feedback: 'Good',
          explanation: 'Correct'
        }
      });

      const response = await request(app.getHttpServer())
        .get('/api/submissions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});

