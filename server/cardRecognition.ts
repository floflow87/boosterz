import type { Card } from "@shared/schema";

interface RecognitionResult {
  playerName: string;
  teamName: string;
  confidence: number;
  matchedCard?: Card;
}

export class CardRecognitionEngine {
  private cards: Card[];
  private playerNames: string[];
  private teamNames: string[];

  constructor(cards: Card[]) {
    this.cards = cards;
    this.playerNames = Array.from(new Set(cards.map(card => card.playerName).filter(Boolean))) as string[];
    this.teamNames = Array.from(new Set(cards.map(card => card.teamName).filter(Boolean))) as string[];
  }

  // Simulate text extraction from image (in real implementation, this would use OCR)
  private simulateTextExtraction(imageData: string): string[] {
    // In a real implementation, this would use OCR to extract text from the image
    // For now, we'll simulate by returning common player/team name patterns
    const simulatedTexts = [
      "MBAPPÉ", "PARIS SAINT-GERMAIN", "PSG", "NEYMAR", "MESSI",
      "BENZEMA", "REAL MADRID", "BAYERN", "MANCHESTER", "LIVERPOOL",
      "BEN YEDDER", "MONACO", "LILLE", "LYON", "MARSEILLE",
      "RENNES", "NICE", "LENS", "MONTPELLIER", "STRASBOURG"
    ];
    
    // Return 2-4 random texts to simulate OCR extraction
    const numTexts = Math.floor(Math.random() * 3) + 2;
    const shuffled = simulatedTexts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTexts);
  }

  // Calculate similarity between two strings using Levenshtein distance
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Find best matching player name from extracted text
  private findBestPlayerMatch(extractedTexts: string[]): { name: string; confidence: number } {
    let bestMatch = "";
    let bestConfidence = 0;

    for (const text of extractedTexts) {
      for (const playerName of this.playerNames) {
        const similarity = this.calculateSimilarity(text, playerName);
        
        // Also check partial matches (last name only)
        const lastName = playerName.split(' ').pop() || '';
        const lastNameSimilarity = this.calculateSimilarity(text, lastName);
        
        const confidence = Math.max(similarity, lastNameSimilarity);
        
        if (confidence > bestConfidence && confidence > 0.6) {
          bestMatch = playerName;
          bestConfidence = confidence;
        }
      }
    }

    return { name: bestMatch, confidence: bestConfidence };
  }

  // Find best matching team name from extracted text
  private findBestTeamMatch(extractedTexts: string[]): { name: string; confidence: number } {
    let bestMatch = "";
    let bestConfidence = 0;

    for (const text of extractedTexts) {
      for (const teamName of this.teamNames) {
        const similarity = this.calculateSimilarity(text, teamName);
        
        // Check for common abbreviations
        const abbreviations = this.getTeamAbbreviations(teamName);
        for (const abbr of abbreviations) {
          const abbrSimilarity = this.calculateSimilarity(text, abbr);
          if (abbrSimilarity > similarity) {
            if (abbrSimilarity > bestConfidence && abbrSimilarity > 0.8) {
              bestMatch = teamName;
              bestConfidence = abbrSimilarity;
            }
          }
        }
        
        if (similarity > bestConfidence && similarity > 0.7) {
          bestMatch = teamName;
          bestConfidence = similarity;
        }
      }
    }

    return { name: bestMatch, confidence: bestConfidence };
  }

  // Get common abbreviations for team names
  private getTeamAbbreviations(teamName: string): string[] {
    const abbreviations: { [key: string]: string[] } = {
      "Paris Saint-Germain": ["PSG", "PARIS"],
      "AS Monaco": ["MONACO", "ASM"],
      "Olympique Lyonnais": ["LYON", "OL"],
      "Olympique de Marseille": ["MARSEILLE", "OM"],
      "Lille OSC": ["LILLE", "LOSC"],
      "Stade Rennais": ["RENNES", "SRFC"],
      "OGC Nice": ["NICE", "OGCN"],
      "RC Lens": ["LENS", "RCL"],
      "Montpellier HSC": ["MONTPELLIER", "MHSC"],
      "RC Strasbourg": ["STRASBOURG", "RCS"]
    };

    return abbreviations[teamName] || [];
  }

  // Main recognition method
  public recognizeCard(imageData: string): RecognitionResult {
    const extractedTexts = this.simulateTextExtraction(imageData);
    
    const playerMatch = this.findBestPlayerMatch(extractedTexts);
    const teamMatch = this.findBestTeamMatch(extractedTexts);
    
    // Find the best matching card based on player and team
    let matchedCard: Card | undefined;
    let overallConfidence = 0;

    if (playerMatch.name) {
      const playerCards = this.cards.filter(card => 
        card.playerName === playerMatch.name
      );
      
      if (teamMatch.name) {
        // Try to find exact match with both player and team
        const exactMatch = playerCards.find(card => 
          card.teamName === teamMatch.name
        );
        
        if (exactMatch) {
          matchedCard = exactMatch;
          overallConfidence = (playerMatch.confidence + teamMatch.confidence) / 2;
        }
      }
      
      // If no exact match, use first card for the player
      if (!matchedCard && playerCards.length > 0) {
        matchedCard = playerCards[0];
        overallConfidence = playerMatch.confidence;
      }
    }

    return {
      playerName: playerMatch.name || "",
      teamName: teamMatch.name || matchedCard?.teamName || "",
      confidence: overallConfidence,
      matchedCard
    };
  }

  // Update the card database for improved recognition
  public updateCards(cards: Card[]): void {
    this.cards = cards;
    this.playerNames = Array.from(new Set(cards.map(card => card.playerName).filter(Boolean))) as string[];
    this.teamNames = Array.from(new Set(cards.map(card => card.teamName).filter(Boolean))) as string[];
  }
}