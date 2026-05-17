import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: "demo@test.com",
      password: "demo123",
      name: "Demo Patient",
      role: "patient",
      language: "en",
    },
    {
      email: "admin@healthcare.com",
      password: "admin123",
      name: "Admin User",
      role: "admin",
      language: "en",
    },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashed,
        name: user.name,
        role: user.role,
        language: user.language,
      },
    });
    console.log(`✅ Seeded: ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
