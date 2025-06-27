export type TrophyRarity = 'none' | 'beginner' | 'common' | 'advanced' | 'rare' | 'epic' | 'legendary';
export type TrophyCategory = 'collection' | 'autographs' | 'specials' | 'social';

export interface TrophyLevel {
  threshold: number;
  rarity: TrophyRarity;
  title: string;
  color: string;
  borderClass: string;
}

export interface Trophy {
  category: TrophyCategory;
  currentCount: number;
  currentLevel: TrophyLevel;
  nextLevel?: TrophyLevel;
  progress: number; // Percentage to next level
  maxAchieved: boolean;
}

export interface UserTrophyStats {
  totalCards: number;
  totalAutographs: number;
  totalSpecials: number;
  totalFollowers: number;
}

// Trophy level definitions
export const TROPHY_LEVELS: Record<TrophyCategory, TrophyLevel[]> = {
  collection: [
    { threshold: 1, rarity: 'beginner', title: 'Première Carte', color: '#6B7280', borderClass: 'border-gray-500' },
    { threshold: 10, rarity: 'common', title: 'Collectionneur Débutant', color: '#10B981', borderClass: 'border-green-500' },
    { threshold: 25, rarity: 'advanced', title: 'Collectionneur Avancé', color: '#3B82F6', borderClass: 'border-blue-500' },
    { threshold: 50, rarity: 'rare', title: 'Collectionneur Expert', color: '#8B5CF6', borderClass: 'border-purple-500' },
    { threshold: 100, rarity: 'epic', title: 'Maître Collectionneur', color: '#F59E0B', borderClass: 'border-yellow-500' },
    { threshold: 200, rarity: 'legendary', title: 'Légende Vivante', color: 'rainbow', borderClass: 'border-rainbow' }
  ],
  autographs: [
    { threshold: 1, rarity: 'beginner', title: 'Premier Autographe', color: '#6B7280', borderClass: 'border-gray-500' },
    { threshold: 10, rarity: 'common', title: 'Chasseur d\'Autographes', color: '#10B981', borderClass: 'border-green-500' },
    { threshold: 25, rarity: 'advanced', title: 'Expert Autographes', color: '#3B82F6', borderClass: 'border-blue-500' },
    { threshold: 50, rarity: 'rare', title: 'Maître des Signatures', color: '#8B5CF6', borderClass: 'border-purple-500' },
    { threshold: 100, rarity: 'epic', title: 'Collectionneur Légendaire', color: '#F59E0B', borderClass: 'border-yellow-500' },
    { threshold: 200, rarity: 'legendary', title: 'Roi des Autographes', color: 'rainbow', borderClass: 'border-rainbow' }
  ],
  specials: [
    { threshold: 1, rarity: 'rare', title: 'Première Spéciale', color: '#8B5CF6', borderClass: 'border-purple-500' },
    { threshold: 10, rarity: 'epic', title: 'Chasseur de Raretés', color: '#F59E0B', borderClass: 'border-yellow-500' },
    { threshold: 50, rarity: 'legendary', title: 'Maître des Spéciales', color: 'rainbow', borderClass: 'border-rainbow' }
  ],
  social: [
    { threshold: 1, rarity: 'beginner', title: 'Premier Abonné', color: '#6B7280', borderClass: 'border-gray-500' },
    { threshold: 10, rarity: 'common', title: 'Influenceur Débutant', color: '#10B981', borderClass: 'border-green-500' },
    { threshold: 50, rarity: 'advanced', title: 'Personnalité Connue', color: '#3B82F6', borderClass: 'border-blue-500' },
    { threshold: 100, rarity: 'rare', title: 'Star de la Communauté', color: '#8B5CF6', borderClass: 'border-purple-500' },
    { threshold: 200, rarity: 'epic', title: 'Célébrité', color: '#F59E0B', borderClass: 'border-yellow-500' },
    { threshold: 500, rarity: 'legendary', title: 'Légende Sociale', color: 'rainbow', borderClass: 'border-rainbow' }
  ]
};

export class TrophySystem {
  static calculateTrophy(category: TrophyCategory, count: number): Trophy {
    const levels = TROPHY_LEVELS[category];
    let currentLevel = levels[0];
    let nextLevel: TrophyLevel | undefined;
    
    // Find the current level achieved
    for (let i = levels.length - 1; i >= 0; i--) {
      if (count >= levels[i].threshold) {
        currentLevel = levels[i];
        nextLevel = i < levels.length - 1 ? levels[i + 1] : undefined;
        break;
      }
    }
    
    // If no level achieved yet, use the first level as next target
    if (count < levels[0].threshold) {
      currentLevel = { threshold: 0, rarity: 'none', title: 'Aucun', color: 'transparent', borderClass: '' };
      nextLevel = levels[0];
    }
    
    // Calculate progress to next level
    let progress = 100;
    if (nextLevel) {
      const currentThreshold = currentLevel.threshold;
      const nextThreshold = nextLevel.threshold;
      const progressInLevel = count - currentThreshold;
      const levelRange = nextThreshold - currentThreshold;
      progress = Math.min(100, (progressInLevel / levelRange) * 100);
    }
    
    return {
      category,
      currentCount: count,
      currentLevel,
      nextLevel,
      progress,
      maxAchieved: !nextLevel
    };
  }
  
  static calculateAllTrophies(stats: UserTrophyStats): Record<TrophyCategory, Trophy> {
    return {
      collection: this.calculateTrophy('collection', stats.totalCards),
      autographs: this.calculateTrophy('autographs', stats.totalAutographs),
      specials: this.calculateTrophy('specials', stats.totalSpecials),
      social: this.calculateTrophy('social', stats.totalFollowers)
    };
  }
  
  static getHighestAchievedRarity(trophies: Record<TrophyCategory, Trophy>): TrophyRarity {
    const rarityOrder: TrophyRarity[] = ['none', 'beginner', 'common', 'advanced', 'rare', 'epic', 'legendary'];
    let highest: TrophyRarity = 'none';
    
    Object.values(trophies).forEach(trophy => {
      if (trophy.currentLevel.rarity !== 'none') {
        const currentIndex = rarityOrder.indexOf(trophy.currentLevel.rarity);
        const highestIndex = rarityOrder.indexOf(highest);
        if (currentIndex > highestIndex) {
          highest = trophy.currentLevel.rarity;
        }
      }
    });
    
    return highest;
  }
  
  static getAvatarBorderClass(highestRarity: TrophyRarity): string {
    switch (highestRarity) {
      case 'legendary':
        return 'border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 animate-pulse';
      case 'epic':
        return 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50';
      case 'rare':
        return 'border-4 border-purple-500 shadow-lg shadow-purple-500/50';
      case 'advanced':
        return 'border-4 border-blue-500 shadow-lg shadow-blue-500/50';
      case 'common':
        return 'border-4 border-green-500 shadow-lg shadow-green-500/50';
      case 'beginner':
        return 'border-4 border-gray-500 shadow-lg shadow-gray-500/50';
      default:
        return 'border-2 border-gray-300';
    }
  }
}

export default TrophySystem;