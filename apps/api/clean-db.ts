import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('Cleaning database tables...');
  await prisma.paymentAllocation.deleteMany({});
  await prisma.receipt.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.feeCharge.deleteMany({});
  await prisma.studentFeeAssignment.deleteMany({});
  await prisma.promotionBatchItem.deleteMany({});
  await prisma.promotionBatch.deleteMany({});
  await prisma.studentEnrolment.deleteMany({});
  await prisma.studentGuardian.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.student.deleteMany({});
  console.log('✅ Database cleaned completely! 0 students, 0 payments, 0 receipts.');
}

cleanData()
  .catch((e) => {
    console.error('Clean failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
