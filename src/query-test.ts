import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const urls = await prisma.url.findMany();
    console.log("SUCCESS: Fetched from DB!");
    console.log("URLs in DB:", urls.map(u => ({ id: u.id, shortCode: u.shortCode, originalUrl: u.originalUrl })));
  } catch (error) {
    console.error("DB Query Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
