import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Purging student data from PostgreSQL database...');
  try {
    // Delete relational payments and charges
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE payments CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE student_enrolments CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE student_guardians CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE guardians CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE student_documents CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE student_fee_assignments CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE fee_charges CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE concessions CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE promotion_batch_items CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE students CASCADE;`);
    
    console.log('Successfully truncated all students and payment tables in PostgreSQL database!');
  } catch (err: any) {
    console.error('Error during purge:', err.message);
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
