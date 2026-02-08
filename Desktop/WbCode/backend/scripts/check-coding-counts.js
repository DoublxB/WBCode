const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, '');
}

async function main() {
  const total = await prisma.codingExercise.count();
  const boss = await prisma.codingExercise.count({ where: { category: { startsWith: 'boss:' } } });
  const nonBoss = await prisma.codingExercise.count({
    where: { OR: [{ category: null }, { category: { not: { startsWith: 'boss:' } } }] }
  });

  const rows = await prisma.codingExercise.findMany({
    where: { OR: [{ category: null }, { category: { not: { startsWith: 'boss:' } } }] },
    select: { id: true, title: true, prompt: true, category: true },
    orderBy: { id: 'asc' }
  });

  const seen = new Set();
  let kept = 0;
  for (const r of rows) {
    const key = `${normalizeKey(r.title)}::${normalizeKey(String(r.prompt || '')).slice(0, 180)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept += 1;
  }

  console.log(
    JSON.stringify(
      {
        total,
        boss,
        nonBoss,
        dedupKept: kept
      },
      null,
      2
    )
  );

  console.log(
    'sample first 10:',
    rows.slice(0, 10).map((r) => ({ id: r.id, title: r.title, cat: r.category }))
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


