require('dotenv').config();
const prisma = require('./src/config/db');
const bcrypt = require('bcrypt');

async function updateCto() {
  const newEmail = "ChiefTech";
  const oldEmail = "cto@geu.ac.in";
  const password = "password123";
  const name = "CTO Graphic Era";
  
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if old user exists
  const existingOld = await prisma.user.findUnique({ where: { email: oldEmail } });
  if (existingOld) {
    await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail, passwordHash }
    });
    console.log("CTO ID updated from cto@geu.ac.in to ChiefTech");
  } else {
    // Upsert ChiefTech directly
    await prisma.user.upsert({
      where: { email: newEmail },
      update: {
        passwordHash,
        role: "CTO",
        isVerified: true
      },
      create: {
        email: newEmail,
        name,
        passwordHash,
        role: "CTO",
        isVerified: true,
        requiresPasswordChange: false
      }
    });
    console.log("CTO created successfully with ID: ChiefTech");
  }

  console.log("Email/Login ID: ", newEmail);
  console.log("Password: ", password);
}

updateCto()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
