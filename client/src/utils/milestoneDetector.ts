interface Collection {
  id: number;
  name: string;
  season?: string;
}

interface CollectionCompletion {
  totalCards: number;
  ownedCards: number;
  percentage: number;
}

interface MilestoneData {
  type: 'completion' | 'streak' | 'rare_find' | 'first_collection' | 'speed_collector';
  percentage: number;
  collectionName: string;
  achievement: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

class MilestoneDetector {
  private static STORAGE_KEY = 'milestone_history';
  
  // Store milestone history in localStorage
  private static getMilestoneHistory(): Record<string, any> {
    try {
      const history = localStorage.getItem(this.STORAGE_KEY);
      return history ? JSON.parse(history) : {};
    } catch {
      return {};
    }
  }

  private static saveMilestoneHistory(history: Record<string, any>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private static getCollectionKey(collection: Collection): string {
    return `${collection.name}_${collection.season || 'unknown'}`;
  }

  // Check for completion milestones
  static checkCompletionMilestones(
    collection: Collection,
    completion: CollectionCompletion,
    previousCompletion?: CollectionCompletion
  ): MilestoneData | null {
    const history = this.getMilestoneHistory();
    const collectionKey = this.getCollectionKey(collection);

    // Track completion milestones for this collection
    if (!history[collectionKey]) {
      history[collectionKey] = {
        milestones: {},
        firstSeen: Date.now(),
        lastPercentage: 0
      };
    }

    const collectionHistory = history[collectionKey];
    const previousPercentage = previousCompletion?.percentage || collectionHistory.lastPercentage || 0;
    const currentPercentage = completion.percentage;

    // Define milestone thresholds
    const milestones = [
      { threshold: 25, rarity: 'common' as const, title: 'Bon Début!', desc: 'Tu as collecté tes 25 premières cartes!' },
      { threshold: 50, rarity: 'rare' as const, title: 'À Mi-Chemin!', desc: 'Tu es à la moitié de ta collection!' },
      { threshold: 75, rarity: 'epic' as const, title: 'Expert Collectionneur!', desc: 'Plus que quelques cartes à trouver!' },
      { threshold: 90, rarity: 'epic' as const, title: 'Presque Parfait!', desc: 'Tu touches au but, encore un petit effort!' },
      { threshold: 100, rarity: 'legendary' as const, title: '🏆 Collection Complète!', desc: 'Félicitations! Tu as terminé cette collection!' }
    ];

    // Check for crossed milestones
    for (const milestone of milestones) {
      const milestoneKey = `completion_${milestone.threshold}`;
      
      if (currentPercentage >= milestone.threshold && 
          previousPercentage < milestone.threshold && 
          !collectionHistory.milestones[milestoneKey]) {
        
        // Mark milestone as achieved
        collectionHistory.milestones[milestoneKey] = Date.now();
        collectionHistory.lastPercentage = currentPercentage;
        this.saveMilestoneHistory(history);

        return {
          type: 'completion',
          percentage: currentPercentage,
          collectionName: collection.name,
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }

    // Update last percentage
    collectionHistory.lastPercentage = currentPercentage;
    this.saveMilestoneHistory(history);

    return null;
  }

  // Check for first collection milestone
  static checkFirstCollectionMilestone(
    collections: Collection[],
    completions: Record<number, CollectionCompletion>
  ): MilestoneData | null {
    const history = this.getMilestoneHistory();
    
    if (history.firstCollectionAchieved) {
      return null;
    }

    // Check if user has started their first collection (>5% completion)
    for (const collection of collections) {
      const completion = completions[collection.id];
      if (completion && completion.percentage > 5) {
        history.firstCollectionAchieved = Date.now();
        this.saveMilestoneHistory(history);

        return {
          type: 'first_collection',
          percentage: completion.percentage,
          collectionName: collection.name,
          achievement: 'Premier Pas!',
          description: 'Tu viens de commencer ta première collection. Bienvenue dans l\'aventure!',
          rarity: 'common'
        };
      }
    }

    return null;
  }

  // Check for streak milestones (cards added in consecutive days)
  static checkStreakMilestone(cardsAddedToday: number): MilestoneData | null {
    const history = this.getMilestoneHistory();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (!history.dailyActivity) {
      history.dailyActivity = {};
    }

    // Record today's activity
    if (cardsAddedToday > 0) {
      history.dailyActivity[today] = cardsAddedToday;
    }

    // Calculate current streak
    let streak = 0;
    let checkDate = new Date();
    
    while (streak < 30) { // Max check 30 days
      const dateStr = checkDate.toDateString();
      if (history.dailyActivity[dateStr]) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    // Check for streak milestones
    const streakMilestones = [
      { days: 3, rarity: 'common' as const, title: 'En Forme!', desc: 'Tu collectionnes depuis 3 jours consécutifs!' },
      { days: 7, rarity: 'rare' as const, title: 'Une Semaine!', desc: 'Sept jours de collection sans interruption!' },
      { days: 14, rarity: 'epic' as const, title: 'Deux Semaines!', desc: 'Ta détermination est impressionnante!' },
      { days: 30, rarity: 'legendary' as const, title: 'Un Mois Complet!', desc: 'Tu es un véritable passionné de cartes!' }
    ];

    for (const milestone of streakMilestones) {
      const milestoneKey = `streak_${milestone.days}`;
      
      if (streak >= milestone.days && !history.streakMilestones?.[milestoneKey]) {
        if (!history.streakMilestones) {
          history.streakMilestones = {};
        }
        
        history.streakMilestones[milestoneKey] = Date.now();
        this.saveMilestoneHistory(history);

        return {
          type: 'streak',
          percentage: 0,
          collectionName: 'Activité Quotidienne',
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }

    this.saveMilestoneHistory(history);
    return null;
  }

  // Check for rare card milestones
  static checkRareCardMilestone(cardType: string, collectionName: string): MilestoneData | null {
    const history = this.getMilestoneHistory();
    
    if (!history.rareCards) {
      history.rareCards = {};
    }

    const rareTypes = [
      { type: 'autograph', rarity: 'legendary' as const, title: 'Autographe Trouvé!', desc: 'Tu as déniché un autographe rare!' },
      { type: 'insert', rarity: 'epic' as const, title: 'Carte Insert!', desc: 'Une carte spéciale ajoutée à ta collection!' },
      { type: 'parallel', rarity: 'rare' as const, title: 'Parallèle Brillante!', desc: 'Une carte parallèle scintillante!' }
    ];

    for (const rareType of rareTypes) {
      if (cardType.toLowerCase().includes(rareType.type)) {
        const milestoneKey = `rare_${rareType.type}_${Date.now()}`;
        
        history.rareCards[milestoneKey] = Date.now();
        this.saveMilestoneHistory(history);

        return {
          type: 'rare_find',
          percentage: 0,
          collectionName,
          achievement: rareType.title,
          description: rareType.desc,
          rarity: rareType.rarity
        };
      }
    }

    return null;
  }

  // Check for speed collector milestone (many cards added quickly)
  static checkSpeedCollectorMilestone(cardsAddedInSession: number): MilestoneData | null {
    const history = this.getMilestoneHistory();
    
    const speedMilestones = [
      { count: 5, rarity: 'common' as const, title: 'Collectionneur Rapide!', desc: 'Tu as ajouté 5 cartes d\'un coup!' },
      { count: 10, rarity: 'rare' as const, title: 'En Feu!', desc: 'Dix cartes en une session, impressionnant!' },
      { count: 20, rarity: 'epic' as const, title: 'Machine à Cartes!', desc: 'Vingt cartes! Tu es en mode turbo!' },
      { count: 50, rarity: 'legendary' as const, title: 'Tsunami de Cartes!', desc: 'Cinquante cartes! Tu es inarrêtable!' }
    ];

    for (const milestone of speedMilestones) {
      const milestoneKey = `speed_${milestone.count}`;
      
      if (cardsAddedInSession >= milestone.count && 
          !history.speedMilestones?.[milestoneKey]) {
        
        if (!history.speedMilestones) {
          history.speedMilestones = {};
        }
        
        history.speedMilestones[milestoneKey] = Date.now();
        this.saveMilestoneHistory(history);

        return {
          type: 'speed_collector',
          percentage: 0,
          collectionName: 'Session de Collection',
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }

    return null;
  }

  // Main method to check all milestones
  static checkAllMilestones(
    collection: Collection,
    completion: CollectionCompletion,
    previousCompletion?: CollectionCompletion,
    collections?: Collection[],
    completions?: Record<number, CollectionCompletion>,
    cardType?: string,
    cardsAddedToday?: number,
    cardsAddedInSession?: number
  ): MilestoneData | null {
    // Check completion milestones first (highest priority)
    const completionMilestone = this.checkCompletionMilestones(collection, completion, previousCompletion);
    if (completionMilestone) return completionMilestone;

    // Check first collection milestone
    if (collections && completions) {
      const firstCollectionMilestone = this.checkFirstCollectionMilestone(collections, completions);
      if (firstCollectionMilestone) return firstCollectionMilestone;
    }

    // Check rare card milestones
    if (cardType) {
      const rareCardMilestone = this.checkRareCardMilestone(cardType, collection.name);
      if (rareCardMilestone) return rareCardMilestone;
    }

    // Check streak milestones
    if (cardsAddedToday !== undefined) {
      const streakMilestone = this.checkStreakMilestone(cardsAddedToday);
      if (streakMilestone) return streakMilestone;
    }

    // Check speed collector milestones
    if (cardsAddedInSession !== undefined) {
      const speedMilestone = this.checkSpeedCollectorMilestone(cardsAddedInSession);
      if (speedMilestone) return speedMilestone;
    }

    return null;
  }

  // Reset milestone history (for testing)
  static resetMilestoneHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export { MilestoneDetector };
export type { MilestoneData };