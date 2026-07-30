import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ─── Seed Safety Guard ───────────────────────────────────────
function assertSeedSafety() {
  const nodeEnv = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL ?? '';
  const allowReset = process.env.ALLOW_DB_SEED_RESET === 'true';

  if (nodeEnv === 'production' && !allowReset) {
    console.error('ERROR: Seeding is blocked in production. Set ALLOW_DB_SEED_RESET=true to override.');
    process.exit(1);
  }

  const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('::1');
  if (isRemote && !allowReset) {
    console.error('ERROR: Seeding is blocked against non-local databases. Set ALLOW_DB_SEED_RESET=true to override.');
    process.exit(1);
  }
}

// ─── Password Helper ─────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

// ─── Seed Data Constants ─────────────────────────────────────
const SCHOOL_ID = '00000000-0000-0000-0000-000000000001';
const ORG_ID = '00000000-0000-0000-0000-000000000002';
const BRANCH_ID = '00000000-0000-0000-0000-000000000003';
const AY_2526_ID = '00000000-0000-0000-0000-000000000010';
const AY_2627_ID = '00000000-0000-0000-0000-000000000011';
const FY_2526_ID = '00000000-0000-0000-0000-000000000012';

async function main() {
  console.log('🌱 Starting MVHS ERP seed...');
  assertSeedSafety();

  // ─── 1. Organisation ─────────────────────────────────────
  console.log('Creating organisation...');
  await prisma.organisation.upsert({
    where: { id: ORG_ID },
    update: {},
    create: {
      id: ORG_ID,
      name: 'Marwari Vidyalaya Educational Trust',
      slug: 'marwari-vidyalaya',
      address: 'Marwari Lane, Mumbai, Maharashtra 400002',
      phone: '02222001234',
      email: 'admin@mvhighschool.edu.in',
      website: 'https://www.mvhighschool.edu.in',
      isActive: true,
    },
  });

  // ─── 2. School ───────────────────────────────────────────
  console.log('Creating school...');
  await prisma.school.upsert({
    where: { id: SCHOOL_ID },
    update: {},
    create: {
      id: SCHOOL_ID,
      organisationId: ORG_ID,
      name: 'Marwari Vidyalaya High School',
      shortCode: 'MVHS',
      address: 'Marwari Lane, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
      phone: '02222001234',
      email: 'admin@mvhighschool.edu.in',
      affiliationBoard: 'SSC',
      principalName: 'Mrs. Sushila Agarwal',
      established: 1952,
      isActive: true,
    },
  });

  // ─── 3. Branch ───────────────────────────────────────────
  console.log('Creating branch...');
  await prisma.branch.upsert({
    where: { id: BRANCH_ID },
    update: {},
    create: {
      id: BRANCH_ID,
      schoolId: SCHOOL_ID,
      name: 'Main Branch - Mumbai',
      code: 'BR01',
      address: 'Marwari Lane, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
      phone: '02222001234',
      email: 'branch.mumbai@mvhighschool.edu.in',
      isActive: true,
    },
  });

  // ─── 4. Academic Years ───────────────────────────────────
  console.log('Creating academic years...');
  await prisma.academicYear.upsert({
    where: { id: AY_2526_ID },
    update: {},
    create: {
      id: AY_2526_ID,
      schoolId: SCHOOL_ID,
      name: '2025-26',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: false,
    },
  });

  await prisma.academicYear.upsert({
    where: { id: AY_2627_ID },
    update: {},
    create: {
      id: AY_2627_ID,
      schoolId: SCHOOL_ID,
      name: '2026-27',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
    },
  });

  // ─── 5. Financial Year ───────────────────────────────────
  console.log('Creating financial year...');
  await prisma.financialYear.upsert({
    where: { id: FY_2526_ID },
    update: {},
    create: {
      id: FY_2526_ID,
      schoolId: SCHOOL_ID,
      name: '2025-26',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
    },
  });

  // ─── 6. Departments (Divisions) ──────────────────────────
  console.log('Creating departments...');
  const depts = [
    { id: '00000000-0000-0000-0001-000000000001', name: 'Pre-Primary', code: 'PP', sortOrder: 1 },
    { id: '00000000-0000-0000-0001-000000000002', name: 'Primary', code: 'PRI', sortOrder: 2 },
    { id: '00000000-0000-0000-0001-000000000003', name: 'Secondary', code: 'SEC', sortOrder: 3 },
  ];
  for (const dept of depts) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: { ...dept, schoolId: SCHOOL_ID, isActive: true },
    });
  }

  // ─── 7. Grades ───────────────────────────────────────────
  console.log('Creating grades...');
  const grades = [
    // Pre-Primary
    { id: '00000000-0000-0000-0002-000000000001', name: 'Nursery', numericValue: -2, sortOrder: 1, deptCode: 'PP' },
    { id: '00000000-0000-0000-0002-000000000002', name: 'Junior KG', numericValue: -1, sortOrder: 2, deptCode: 'PP' },
    { id: '00000000-0000-0000-0002-000000000003', name: 'Senior KG', numericValue: 0, sortOrder: 3, deptCode: 'PP' },
    // Primary
    { id: '00000000-0000-0000-0002-000000000004', name: 'Grade 1', numericValue: 1, sortOrder: 4, deptCode: 'PRI' },
    { id: '00000000-0000-0000-0002-000000000005', name: 'Grade 2', numericValue: 2, sortOrder: 5, deptCode: 'PRI' },
    { id: '00000000-0000-0000-0002-000000000006', name: 'Grade 3', numericValue: 3, sortOrder: 6, deptCode: 'PRI' },
    { id: '00000000-0000-0000-0002-000000000007', name: 'Grade 4', numericValue: 4, sortOrder: 7, deptCode: 'PRI' },
    { id: '00000000-0000-0000-0002-000000000008', name: 'Grade 5', numericValue: 5, sortOrder: 8, deptCode: 'PRI' },
    // Secondary
    { id: '00000000-0000-0000-0002-000000000009', name: 'Grade 6', numericValue: 6, sortOrder: 9, deptCode: 'SEC' },
    { id: '00000000-0000-0000-0002-000000000010', name: 'Grade 7', numericValue: 7, sortOrder: 10, deptCode: 'SEC' },
    { id: '00000000-0000-0000-0002-000000000011', name: 'Grade 8', numericValue: 8, sortOrder: 11, deptCode: 'SEC' },
    { id: '00000000-0000-0000-0002-000000000012', name: 'Grade 9', numericValue: 9, sortOrder: 12, deptCode: 'SEC' },
    { id: '00000000-0000-0000-0002-000000000013', name: 'Grade 10', numericValue: 10, sortOrder: 13, deptCode: 'SEC' },
  ];

  const deptIdMap: Record<string, string> = {
    PP: '00000000-0000-0000-0001-000000000001',
    PRI: '00000000-0000-0000-0001-000000000002',
    SEC: '00000000-0000-0000-0001-000000000003',
  };

  for (const g of grades) {
    await prisma.grade.upsert({
      where: { id: g.id },
      update: {},
      create: {
        id: g.id,
        schoolId: SCHOOL_ID,
        departmentId: deptIdMap[g.deptCode],
        name: g.name,
        numericValue: g.numericValue,
        sortOrder: g.sortOrder,
        isActive: true,
      },
    });
  }

  // ─── 8. Sections ─────────────────────────────────────────
  console.log('Creating sections...');
  let sectionCounter = 1;
  for (const g of grades) {
    for (const sectionName of ['A', 'B']) {
      const secId = `00000000-0000-0000-0003-${String(sectionCounter).padStart(12, '0')}`;
      sectionCounter++;
      await prisma.section.upsert({
        where: { id: secId },
        update: {},
        create: {
          id: secId,
          gradeId: g.id,
          schoolId: SCHOOL_ID,
          name: sectionName,
          capacity: 40,
          isActive: true,
        },
      });
    }
  }

  // ─── 9. Fee Heads ────────────────────────────────────────
  console.log('Creating fee heads...');
  const feeHeads = [
    { id: '00000000-0000-0000-0004-000000000001', name: 'Admission Fee', code: 'ADM_FEE', category: 'ADMISSION', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000002', name: 'Tuition Fee', code: 'TUITION', category: 'TUITION', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000003', name: 'Development Fee', code: 'DEV_FEE', category: 'MAINTENANCE', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000004', name: 'Examination Fee', code: 'EXAM_FEE', category: 'EXAMINATION', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000005', name: 'Activity Fee', code: 'ACTIVITY', category: 'ACTIVITY', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000006', name: 'Library Fee', code: 'LIBRARY', category: 'LIBRARY', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000007', name: 'Computer Lab Fee', code: 'COMPUTER', category: 'ACTIVITY', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000008', name: 'Sports Fee', code: 'SPORTS', category: 'ACTIVITY', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000009', name: 'Transport Fee', code: 'TRANSPORT', category: 'TRANSPORT', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000010', name: 'Late Payment Charge', code: 'LATE_FEE', category: 'LATE_FEE', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000011', name: 'Previous Year Balance', code: 'ARREAR', category: 'ARREAR', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000012', name: 'Annual Day Contribution', code: 'ANNUAL_DAY', category: 'OTHER', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000013', name: 'Caution Deposit', code: 'CAUTION', category: 'OTHER', isRefundable: true },
    { id: '00000000-0000-0000-0004-000000000014', name: 'Uniform Fee', code: 'UNIFORM', category: 'OTHER', isRefundable: false },
    { id: '00000000-0000-0000-0004-000000000015', name: 'Stationery Fee', code: 'STATIONERY', category: 'OTHER', isRefundable: false },
  ];

  for (let i = 0; i < feeHeads.length; i++) {
    const fh = feeHeads[i];
    await prisma.feeHead.upsert({
      where: { id: fh.id },
      update: {},
      create: {
        ...fh,
        schoolId: SCHOOL_ID,
        sortOrder: i + 1,
        isOptional: false,
        isActive: true,
      },
    });
  }

  // ─── 10. Roles and Permissions ───────────────────────────
  console.log('Creating roles and permissions...');

  const rolesData = [
    { id: '00000000-0000-0000-0005-000000000001', name: 'platform_super_admin', displayName: 'Platform Super Admin' },
    { id: '00000000-0000-0000-0005-000000000002', name: 'school_admin', displayName: 'School Admin' },
    { id: '00000000-0000-0000-0005-000000000003', name: 'branch_admin', displayName: 'Branch Admin' },
    { id: '00000000-0000-0000-0005-000000000004', name: 'accounts_administrator', displayName: 'Accounts Administrator' },
    { id: '00000000-0000-0000-0005-000000000005', name: 'cashier', displayName: 'Cashier' },
    { id: '00000000-0000-0000-0005-000000000006', name: 'admission_operator', displayName: 'Admission Operator' },
    { id: '00000000-0000-0000-0005-000000000007', name: 'preprimary_operator', displayName: 'Pre-Primary Operator' },
    { id: '00000000-0000-0000-0005-000000000008', name: 'primary_operator', displayName: 'Primary Operator' },
    { id: '00000000-0000-0000-0005-000000000009', name: 'secondary_operator', displayName: 'Secondary Operator' },
    { id: '00000000-0000-0000-0005-000000000010', name: 'auditor', displayName: 'Auditor' },
    { id: '00000000-0000-0000-0005-000000000011', name: 'principal_management', displayName: 'Principal / Management' },
    { id: '00000000-0000-0000-0005-000000000012', name: 'parent', displayName: 'Parent' },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: { ...role, schoolId: SCHOOL_ID, isSystem: true },
    });
  }

  // Core permissions
  const resources = ['students', 'guardians', 'admissions', 'fee_structures', 'fee_assignments', 'payments', 'receipts', 'concessions', 'reports', 'analytics', 'imports', 'promotions', 'users', 'roles', 'audit_logs', 'settings', 'organisations', 'branches', 'grades', 'sections', 'fee_heads'];
  const actions = ['view', 'create', 'update', 'approve', 'collect', 'print', 'export', 'reverse', 'refund', 'configure', 'manage_users'];

  let permCounter = 1;
  for (const resource of resources) {
    for (const action of actions) {
      const permId = `00000000-0000-0000-0006-${String(permCounter).padStart(12, '0')}`;
      permCounter++;
      await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { id: permId, resource, action },
      });
    }
  }

  // ─── 11. Users ───────────────────────────────────────────
  console.log('Creating users...');
  const defaultPassword = await hashPassword('TestPass@001');

  const usersData = [
    { id: '00000000-0000-0000-0007-000000000001', email: 'superadmin@mvhighschool.edu.in', name: 'Platform Super Admin', roleId: '00000000-0000-0000-0005-000000000001', pwHash: await hashPassword('TestPass@001') },
    { id: '00000000-0000-0000-0007-000000000002', email: 'admin@mvhighschool.edu.in', name: 'School Admin', roleId: '00000000-0000-0000-0005-000000000002', pwHash: await hashPassword('TestPass@002') },
    { id: '00000000-0000-0000-0007-000000000003', email: 'branch.admin@mvhighschool.edu.in', name: 'Branch Admin', roleId: '00000000-0000-0000-0005-000000000003', pwHash: await hashPassword('TestPass@003') },
    { id: '00000000-0000-0000-0007-000000000004', email: 'accounts@mvhighschool.edu.in', name: 'Accounts Administrator', roleId: '00000000-0000-0000-0005-000000000004', pwHash: await hashPassword('TestPass@004') },
    { id: '00000000-0000-0000-0007-000000000005', email: 'cashier@mvhighschool.edu.in', name: 'Cashier', roleId: '00000000-0000-0000-0005-000000000005', pwHash: await hashPassword('TestPass@005') },
    { id: '00000000-0000-0000-0007-000000000006', email: 'admission@mvhighschool.edu.in', name: 'Admission Operator', roleId: '00000000-0000-0000-0005-000000000006', pwHash: await hashPassword('TestPass@006') },
    { id: '00000000-0000-0000-0007-000000000007', email: 'preprimary@mvhighschool.edu.in', name: 'Pre-Primary Operator', roleId: '00000000-0000-0000-0005-000000000007', pwHash: await hashPassword('TestPass@007') },
    { id: '00000000-0000-0000-0007-000000000008', email: 'primary@mvhighschool.edu.in', name: 'Primary Operator', roleId: '00000000-0000-0000-0005-000000000008', pwHash: await hashPassword('TestPass@008') },
    { id: '00000000-0000-0000-0007-000000000009', email: 'secondary@mvhighschool.edu.in', name: 'Secondary Operator', roleId: '00000000-0000-0000-0005-000000000009', pwHash: await hashPassword('TestPass@009') },
    { id: '00000000-0000-0000-0007-000000000010', email: 'auditor@mvhighschool.edu.in', name: 'Auditor', roleId: '00000000-0000-0000-0005-000000000010', pwHash: await hashPassword('TestPass@010') },
    { id: '00000000-0000-0000-0007-000000000011', email: 'principal@mvhighschool.edu.in', name: 'Principal Sushila Agarwal', roleId: '00000000-0000-0000-0005-000000000011', pwHash: await hashPassword('TestPass@011') },
    { id: '00000000-0000-0000-0007-000000000012', email: 'parent001@example.com', name: 'Test Parent 001', roleId: '00000000-0000-0000-0005-000000000012', pwHash: await hashPassword('TestPass@012') },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        schoolId: SCHOOL_ID,
        email: u.email,
        passwordHash: u.pwHash,
        name: u.name,
        status: 'ACTIVE',
        failedLoginCount: 0,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: u.roleId } },
      update: {},
      create: { userId: u.id, roleId: u.roleId },
    });
  }

  // ─── 12. Receipt Sequence ────────────────────────────────
  console.log('Creating receipt sequence...');
  await prisma.receiptSequence.upsert({
    where: { branchId_financialYearId: { branchId: BRANCH_ID, financialYearId: FY_2526_ID } },
    update: {},
    create: {
      branchId: BRANCH_ID,
      financialYearId: FY_2526_ID,
      prefix: 'MVHS/2025-26/BR01',
      lastSequence: 0,
    },
  });

  // ─── 13. Application Settings ────────────────────────────
  console.log('Creating application settings...');
  const settings = [
    { key: 'receipt_number_format', value: 'MVHS/{YEAR}/{BRANCH}/{SEQ6}' },
    { key: 'fee_due_day_of_month', value: '10' },
    { key: 'late_fee_grace_days', value: '5' },
    { key: 'advance_payment_enabled', value: 'false' },
    { key: 'cheque_clearing_days', value: '3' },
    { key: 'max_concession_cashier', value: '0' },
    { key: 'max_concession_accounts_admin', value: '5000' },
    { key: 'max_concession_branch_admin', value: '20000' },
    { key: 'max_concession_school_admin', value: 'unlimited' },
  ];

  for (const s of settings) {
    await prisma.applicationSettings.upsert({
      where: { schoolId_key: { schoolId: SCHOOL_ID, key: s.key } },
      update: {},
      create: { schoolId: SCHOOL_ID, key: s.key, value: s.value },
    });
  }

  console.log('');
  console.log('✅ MVHS ERP seed complete!');
  console.log('');
  console.log('Test Accounts:');
  console.log('  superadmin@mvhighschool.edu.in  /  TestPass@001  (Platform Super Admin)');
  console.log('  admin@mvhighschool.edu.in        /  TestPass@002  (School Admin)');
  console.log('  accounts@mvhighschool.edu.in     /  TestPass@004  (Accounts Administrator)');
  console.log('  cashier@mvhighschool.edu.in      /  TestPass@005  (Cashier)');
  console.log('  auditor@mvhighschool.edu.in      /  TestPass@010  (Auditor)');
  console.log('  parent001@example.com            /  TestPass@012  (Parent)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
