import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function generateHashes() {
  const test25Hash = await hashPassword("Test25");
  console.log("Hash for Test25:", test25Hash);
}

generateHashes().catch(console.error);