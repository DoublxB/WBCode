import { PrismaClient, RoleType } from '@prisma/client';
import { Role } from '../src/common/constants/roles';

const prisma = new PrismaClient();
const HASHED_PASSWORD = '$2b$10$WEDcPu9EDOrPiXGeA4MaROP6QE00lAjFX9YTMZyv5TjFPzN8CUZCO';

async function main() {
  const roles = await Promise.all(
    Object.values(Role).map((name) =>
      prisma.role.upsert({
        where: { name: name as RoleType },
        update: {},
        create: { name: name as RoleType }
      })
    )
  );

  const [studentRole, professorRole, adminRole] = roles;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wbcode.com' },
    update: {},
    create: {
      email: 'admin@wbcode.com',
      password: HASHED_PASSWORD,
      firstName: 'System',
      lastName: 'Admin',
      roleId: adminRole.id,
      xp: 1000,
      level: 5
    }
  });

  const professor = await prisma.user.upsert({
    where: { email: 'professor@wbcode.com' },
    update: {},
    create: {
      email: 'professor@wbcode.com',
      password: HASHED_PASSWORD,
      firstName: 'Prof',
      lastName: 'Coder',
      roleId: professorRole.id,
      xp: 800,
      level: 4
    }
  });

  const students = await Promise.all(
    ['alex', 'bianca', 'cristian'].map((name, idx) =>
      prisma.user.upsert({
        where: { email: `${name}@wbcode.com` },
        update: {},
        create: {
          email: `${name}@wbcode.com`,
          password: HASHED_PASSWORD,
          firstName: name.charAt(0).toUpperCase() + name.slice(1),
          lastName: 'Learner',
          roleId: studentRole.id,
          xp: 100 * (idx + 1),
          level: 1 + idx
        }
      })
    )
  );

  const lesson = await prisma.lesson.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Recursion Basics',
      description: 'Understand recursion via factorial and fibonacci.',
      content: '# Recursion\n Learn by doing!',
      difficulty: 'Intermediate',
      tags: ['recursion', 'algorithms'],
      authorId: professor.id
    }
  });

  const quiz = await prisma.quiz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      lessonId: lesson.id,
      title: 'Recursion Checkpoint',
      description: 'Test your recursion knowledge',
      timeLimit: 600,
      questions: {
        create: [
          {
            prompt: 'What is the base case of factorial?',
            type: 'SINGLE',
            options: ['n == 0', 'n == 1', 'n == 2'],
            answerKey: 'n == 0',
            explanation: 'factorial(0) = 1 ensures recursion stops.'
          },
          {
            prompt: 'Recursion requires?',
            type: 'SINGLE',
            options: ['Loop', 'Base case + recursive step'],
            answerKey: 'Base case + recursive step',
            explanation: 'Both are mandatory.'
          }
        ]
      }
    }
  });

  await prisma.codingExercise.upsert({
    where: { id: 1 },
    update: {},
    create: {
      lessonId: lesson.id,
      title: 'Fibonacci Generator',
      prompt: 'Print first N fibonacci numbers',
      starterCode: 'def fib(n):\n    pass',
      difficulty: 'Intermediate',
      language: 'PYTHON',
      inputSpec: 'Provide N',
      outputSpec: 'Sequence separated by spaces'
    }
  });

  await prisma.badge.createMany({
    data: [
      { code: 'rookie', name: 'Rookie', description: 'Earn 100 XP', threshold: 100 },
      { code: 'scholar', name: 'Scholar', description: 'Earn 500 XP', threshold: 500 },
      { code: 'legend', name: 'Legend', description: 'Earn 1000 XP', threshold: 1000 }
    ],
    skipDuplicates: true
  });

  await prisma.weeklyMission.createMany({
    data: [
      {
        title: 'Complete 3 quizzes',
        description: 'Stay consistent with quizzes this week',
        goalType: 'QUIZZES',
        goalValue: 3,
        rewardXP: 120,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        creatorId: professor.id
      }
    ]
  });

  await prisma.friendship.createMany({
    data: [
      { requester: students[0].id, addressee: students[1].id, status: 'accepted' },
      { requester: students[1].id, addressee: students[2].id, status: 'accepted' }
    ],
    skipDuplicates: true
  });

  console.log('✅ Database seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

