const prisma = require('../src/config/db');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding database...');

  // 1. Create Departments
  const cseDept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      name: 'Computer Science and Engineering',
      code: 'CSE'
    }
  });

  const meDept = await prisma.department.upsert({
    where: { code: 'ME' },
    update: {},
    create: {
      name: 'Mechanical Engineering',
      code: 'ME'
    }
  });

  console.log('Departments created:', [cseDept.code, meDept.code]);

  // 2. Create DEVELOPER User (Root access) - using existing superadmin email if user wants them as dev
  const devPassword = await bcrypt.hash('Developer@123', 10);
  const developer = await prisma.user.upsert({
    where: { email: 'superadmin@geu.ac.in' },
    update: { role: 'DEVELOPER' },
    create: {
      name: 'System Developer',
      email: 'superadmin@geu.ac.in', // The user requested to make existing super admin as developer
      passwordHash: devPassword,
      role: 'DEVELOPER',
      isVerified: true,
      requiresPasswordChange: false,
    }
  });

  console.log('Developer user created:', developer.email);

  // 3. Create Super Admin User (A new one since the old one is Developer now)
  const saPassword = await bcrypt.hash('Superadmin@123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'sa@geu.ac.in' },
    update: {},
    create: {
      name: 'University Super Admin',
      email: 'sa@geu.ac.in',
      passwordHash: saPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      requiresPasswordChange: false,
    }
  });

  console.log('SuperAdmin user created:', superAdmin.email);

  // 4. Create CTO User
  const ctoPassword = await bcrypt.hash('Cto@123', 10);
  const cto = await prisma.user.upsert({
    where: { email: 'cto@geu.ac.in' },
    update: {},
    create: {
      name: 'Chief Technology Officer',
      email: 'cto@geu.ac.in',
      passwordHash: ctoPassword,
      role: 'CTO',
      isVerified: true,
      requiresPasswordChange: false,
    }
  });

  console.log('CTO user created:', cto.email);

  // 5. Create a default Admin for CSE
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const cseAdmin = await prisma.user.upsert({
    where: { email: 'cseadmin@geu.ac.in' },
    update: {},
    create: {
      name: 'CSE Admin',
      email: 'cseadmin@geu.ac.in',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      requiresPasswordChange: false,
      departmentId: cseDept.id
    }
  });

  console.log('CSE Admin user created:', cseAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
