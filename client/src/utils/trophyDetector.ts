interface TrophyMilestone {
  type: 'collection' | 'autographs' | 'specials' | 'social';
  count: number;
  collectionName: string;
  achievement: string;
  description: string;
  rarity: 'beginner' | 'common' | 'advanced' | 'rare' | 'epic' | 'legendary';
}

export class TrophyDetector {
  private static STORAGE_KEY = 'trophy_history';

  private static getTrophyHistory(): Record<string, boolean> {
    try {
      const history = localStorage.getItem(this.STORAGE_KEY);
      return history ? JSON.parse(history) : {};
    } catch {
      return {};
    }
  }

  private static saveTrophyHistory(history: Record<string, boolean>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }

  // Jalons Collection (cartes normales)
  static checkCollectionMilestones(totalCards: number): TrophyMilestone | null {
    const history = this.getTrophyHistory();
    const milestones = [
      { threshold: 1, rarity: 'beginner' as const, title: 'Première Carte', desc: 'Tu as ajouté ta première carte!' },
      { threshold: 10, rarity: 'common' as const, title: 'Collectionneur Débutant', desc: 'Tu as 10 cartes dans ta collection!' },
      { threshold: 25, rarity: 'advanced' as const, title: 'Collectionneur Avancé', desc: 'Tu as 25 cartes, bien joué!' },
      { threshold: 50, rarity: 'rare' as const, title: 'Collectionneur Expert', desc: 'Tu as 50 cartes, impressionnant!' },
      { threshold: 100, rarity: 'epic' as const, title: 'Maître Collectionneur', desc: 'Tu as 100 cartes, tu es un expert!' },
      { threshold: 200, rarity: 'legendary' as const, title: 'Légende Vivante', desc: 'Tu as 200 cartes, tu es une légende!' }
    ];

    for (const milestone of milestones) {
      const key = `collection_${milestone.threshold}`;
      if (totalCards >= milestone.threshold && !history[key]) {
        history[key] = true;
        this.saveTrophyHistory(history);
        
        return {
          type: 'collection',
          count: totalCards,
          collectionName: 'Collection Générale',
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }
    return null;
  }

  // Jalons Autographes
  static checkAutographMilestones(totalAutographs: number): TrophyMilestone | null {
    const history = this.getTrophyHistory();
    const milestones = [
      { threshold: 1, rarity: 'beginner' as const, title: 'Premier Autographe', desc: 'Tu as ton premier autographe!' },
      { threshold: 10, rarity: 'common' as const, title: 'Chasseur d\'Autographes', desc: 'Tu as 10 autographes!' },
      { threshold: 25, rarity: 'advanced' as const, title: 'Expert Autographes', desc: 'Tu as 25 autographes!' },
      { threshold: 50, rarity: 'rare' as const, title: 'Maître des Signatures', desc: 'Tu as 50 autographes!' },
      { threshold: 100, rarity: 'epic' as const, title: 'Collectionneur Légendaire', desc: 'Tu as 100 autographes!' },
      { threshold: 200, rarity: 'legendary' as const, title: 'Roi des Autographes', desc: 'Tu as 200 autographes!' }
    ];

    for (const milestone of milestones) {
      const key = `autographs_${milestone.threshold}`;
      if (totalAutographs >= milestone.threshold && !history[key]) {
        history[key] = true;
        this.saveTrophyHistory(history);
        
        return {
          type: 'autographs',
          count: totalAutographs,
          collectionName: 'Autographes',
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }
    return null;
  }

  // Jalons Spéciales
  static checkSpecialMilestones(totalSpecials: number): TrophyMilestone | null {
    const history = this.getTrophyHistory();
    const milestones = [
      { threshold: 1, rarity: 'rare' as const, title: 'Première Spéciale', desc: 'Tu as ta première carte spéciale!' },
      { threshold: 10, rarity: 'epic' as const, title: 'Chasseur de Raretés', desc: 'Tu as 10 cartes spéciales!' },
      { threshold: 50, rarity: 'legendary' as const, title: 'Maître des Spéciales', desc: 'Tu as 50 cartes spéciales!' }
    ];

    for (const milestone of milestones) {
      const key = `specials_${milestone.threshold}`;
      if (totalSpecials >= milestone.threshold && !history[key]) {
        history[key] = true;
        this.saveTrophyHistory(history);
        
        return {
          type: 'specials',
          count: totalSpecials,
          collectionName: 'Cartes Spéciales',
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }
    return null;
  }

  // Jalons Social (abonnés)
  static checkSocialMilestones(totalFollowers: number): TrophyMilestone | null {
    const history = this.getTrophyHistory();
    const milestones = [
      { threshold: 1, rarity: 'beginner' as const, title: 'Premier Abonné', desc: 'Tu as ton premier abonné!' },
      { threshold: 10, rarity: 'common' as const, title: 'Influenceur Débutant', desc: 'Tu as 10 abonnés!' },
      { threshold: 50, rarity: 'advanced' as const, title: 'Personnalité Connue', desc: 'Tu as 50 abonnés!' },
      { threshold: 100, rarity: 'rare' as const, title: 'Star de la Communauté', desc: 'Tu as 100 abonnés!' },
      { threshold: 200, rarity: 'epic' as const, title: 'Célébrité', desc: 'Tu as 200 abonnés!' },
      { threshold: 500, rarity: 'legendary' as const, title: 'Légende Sociale', desc: 'Tu as 500 abonnés!' }
    ];

    for (const milestone of milestones) {
      const key = `social_${milestone.threshold}`;
      if (totalFollowers >= milestone.threshold && !history[key]) {
        history[key] = true;
        this.saveTrophyHistory(history);
        
        return {
          type: 'social',
          count: totalFollowers,
          collectionName: 'Communauté',
          achievement: milestone.title,
          description: milestone.desc,
          rarity: milestone.rarity
        };
      }
    }
    return null;
  }

  static checkAllMilestones(
    totalCards: number,
    totalAutographs: number,
    totalSpecials: number,
    totalFollowers: number
  ): TrophyMilestone | null {
    // Check each milestone type in priority order
    return this.checkCollectionMilestones(totalCards) ||
           this.checkAutographMilestones(totalAutographs) ||
           this.checkSpecialMilestones(totalSpecials) ||
           this.checkSocialMilestones(totalFollowers);
  }

  static resetTrophyHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}

export default TrophyDetector;