import { db } from "./db";
import { cards, collections } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function performHealthCheck() {
  console.log("🔍 Starting health check...");
  
  try {
    // Test database connection
    console.log("Testing database connection...");
    const startDb = Date.now();
    await db.select().from(collections).limit(1);
    console.log(`✅ Database connection OK (${Date.now() - startDb}ms)`);
    
    // Test cards query performance
    console.log("Testing cards query performance...");
    const startCards = Date.now();
    const testCards = await db.select().from(cards).where(eq(cards.collectionId, 1)).limit(100);
    console.log(`✅ Cards query OK - ${testCards.length} cards loaded (${Date.now() - startCards}ms)`);
    
    // Test full collection load
    console.log("Testing full collection load...");
    const startFull = Date.now();
    const allCards = await db.select().from(cards).where(eq(cards.collectionId, 1));
    console.log(`✅ Full collection load OK - ${allCards.length} cards total (${Date.now() - startFull}ms)`);
    
    return {
      status: "healthy",
      database: "connected",
      cardsCount: allCards.length,
      performanceMs: Date.now() - startFull
    };
    
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return {
      status: "unhealthy",
      error: error.message
    };
  }
}