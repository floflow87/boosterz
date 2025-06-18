import { seedDatabase } from "./seedDatabase";

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
}

main();