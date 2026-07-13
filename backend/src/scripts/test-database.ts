import { prisma } from "../lib/prisma.js";

async function testDatabase() {
  const userCount = await prisma.user.count();

  console.log("");
  console.log("Neon database connection successful.");
  console.log(`Users currently stored: ${userCount}`);
  console.log("");
}

testDatabase()
  .catch((error: unknown) => {
    console.error("Database connection test failed:");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
