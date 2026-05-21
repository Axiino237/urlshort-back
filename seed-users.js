const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Axiino Links users...');

  // 1. Seed SUPER_ADMIN
  const superAdmin = await prisma.profile.upsert({
    where: { email: 'superadmin@axiino.com' },
    update: {
      name: 'Alax Axiino',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      balance: 450000.0,
      totalEarned: 1200000.0,
    },
    create: {
      id: 'sa-1',
      email: 'superadmin@axiino.com',
      name: 'Alax Axiino',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      balance: 450000.0,
      totalEarned: 1200000.0,
    },
  });
  console.log('✅ Seeded SUPER_ADMIN user:', superAdmin.email);

  // 2. Seed ADMIN
  const admin = await prisma.profile.upsert({
    where: { email: 'admin_vikram@axiino.com' },
    update: {
      name: 'Vikram Singh',
      role: 'ADMIN',
      status: 'ACTIVE',
      balance: 24500.0,
      totalEarned: 78000.0,
    },
    create: {
      id: 'adm-1',
      email: 'admin_vikram@axiino.com',
      name: 'Vikram Singh',
      role: 'ADMIN',
      status: 'ACTIVE',
      balance: 24500.0,
      totalEarned: 78000.0,
    },
  });
  console.log('✅ Seeded ADMIN user:', admin.email);

  // 3. Seed standard USER
  const user = await prisma.profile.upsert({
    where: { email: 'user_prakash@axiino.com' },
    update: {
      name: 'Prakash Kumar',
      role: 'USER',
      status: 'ACTIVE',
      balance: 350.0,
      totalEarned: 1200.0,
      adminId: 'adm-1',
    },
    create: {
      id: 'usr-1',
      email: 'user_prakash@axiino.com',
      name: 'Prakash Kumar',
      role: 'USER',
      status: 'ACTIVE',
      balance: 350.0,
      totalEarned: 1200.0,
      adminId: 'adm-1',
    },
  });
  console.log('✅ Seeded standard USER profile:', user.email);

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
