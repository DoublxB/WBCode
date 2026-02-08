const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SLUGS = [
  'procedural-programming',
  'object-oriented',
  'data-structures',
  'algorithms-logic',
  'databases-sql',
  'software-architecture'
];

(async () => {
  try {
    const out = {};
    for (const slug of SLUGS) {
      out[slug] = await prisma.codingExercise.count({ where: { category: slug } });
    }
    const totalRoadmap = Object.values(out).reduce((a, b) => a + b, 0);
    console.log(JSON.stringify({ perModule: out, totalRoadmap }, null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();




