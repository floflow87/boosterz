import bcrypt from 'bcryptjs';

async function hashPassword() {
  const password = 'Test25';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log(hashedPassword);
}

hashPassword();