import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const studentsCount = await prisma.student.count();
  const paymentsCount = await prisma.payment.count();
  console.log(`Database Status: ${studentsCount} students, ${paymentsCount} payments.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
