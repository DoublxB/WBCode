import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.cosmeticItem.groupBy({
    by: ['type'],
    _count: { _all: true }
  });

  console.log('CosmeticItem counts by type:');
  for (const row of items) {
    console.log(`${row.type}: ${row._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





