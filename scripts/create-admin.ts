import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME || "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: "ADMIN",
        name,
      },
    });
    console.log(`Admin updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        name,
      },
    });
    console.log(`Admin created: ${email}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
