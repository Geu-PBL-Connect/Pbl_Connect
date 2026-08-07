const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCto() {
  const email = "cto@geu.ac.in";
  const password = "password123";
  const name = "CTO Graphic Era";
  
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "CTO",
      isVerified: true
    },
    create: {
      email,
      name,
      passwordHash,
      role: "CTO",
      isVerified: true,
      requiresPasswordChange: false
    }
  });

  console.log("CTO created successfully!");
  console.log("Email: ", user.email);
  console.log("Password: ", password);
}

createCto()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
