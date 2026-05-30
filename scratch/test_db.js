import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    console.log("Database URL:", process.env.DATABASE_URL);
    const users = await prisma.user.findMany({ take: 1 });
    console.log("SUCCESS! Users count:", users.length);
  } catch (err) {
    console.error("ERROR CONNECTING TO DATABASE:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
