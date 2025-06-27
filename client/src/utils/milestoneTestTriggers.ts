import { type MilestoneData } from "./milestoneDetector";

// Helper functions to manually trigger milestones for testing
export class MilestoneTestTriggers {
  static createTestMilestone(type: 'completion' | 'streak' | 'rare_find' | 'first_collection' | 'speed_collector'): MilestoneData {
    const testMilestones = {
      completion: {
        type: 'completion' as const,
        percentage: 25,
        collectionName: 'Score Ligue 1 23/24',
        achievement: 'Bon Début!',
        description: 'Tu as collecté tes 25 premières cartes!',
        rarity: 'common' as const
      },
      streak: {
        type: 'streak' as const,
        percentage: 0,
        collectionName: 'Activité Quotidienne',
        achievement: 'En Forme!',
        description: 'Tu collectionnes depuis 3 jours consécutifs!',
        rarity: 'common' as const
      },
      rare_find: {
        type: 'rare_find' as const,
        percentage: 0,
        collectionName: 'Score Ligue 1 23/24',
        achievement: 'Autographe Trouvé!',
        description: 'Tu as déniché un autographe rare!',
        rarity: 'legendary' as const
      },
      first_collection: {
        type: 'first_collection' as const,
        percentage: 10,
        collectionName: 'Score Ligue 1 23/24',
        achievement: 'Premier Pas!',
        description: 'Tu viens de commencer ta première collection. Bienvenue dans l\'aventure!',
        rarity: 'common' as const
      },
      speed_collector: {
        type: 'speed_collector' as const,
        percentage: 0,
        collectionName: 'Session de Collection',
        achievement: 'Collectionneur Rapide!',
        description: 'Tu as ajouté 5 cartes d\'un coup!',
        rarity: 'common' as const
      }
    };

    return testMilestones[type];
  }

  static getRandomMilestone(): MilestoneData {
    const types: Array<'completion' | 'streak' | 'rare_find' | 'first_collection' | 'speed_collector'> = 
      ['completion', 'streak', 'rare_find', 'first_collection', 'speed_collector'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return this.createTestMilestone(randomType);
  }

  static createCompletionMilestone(percentage: number): MilestoneData {
    const milestoneMap = [
      { threshold: 25, rarity: 'common' as const, title: 'Bon Début!', desc: 'Tu as collecté tes 25 premières cartes!' },
      { threshold: 50, rarity: 'rare' as const, title: 'À Mi-Chemin!', desc: 'Tu es à la moitié de ta collection!' },
      { threshold: 75, rarity: 'epic' as const, title: 'Expert Collectionneur!', desc: 'Plus que quelques cartes à trouver!' },
      { threshold: 90, rarity: 'epic' as const, title: 'Presque Parfait!', desc: 'Tu touches au but, encore un petit effort!' },
      { threshold: 100, rarity: 'legendary' as const, title: '🏆 Collection Complète!', desc: 'Félicitations! Tu as terminé cette collection!' }
    ];

    const milestone = milestoneMap.find(m => percentage >= m.threshold) || milestoneMap[0];
    
    return {
      type: 'completion',
      percentage,
      collectionName: 'Score Ligue 1 23/24',
      achievement: milestone.title,
      description: milestone.desc,
      rarity: milestone.rarity
    };
  }
}

// For development/testing - add to window object
if (typeof window !== 'undefined') {
  (window as any).triggerTestMilestone = (type?: string) => {
    const milestoneType = type || 'completion';
    return MilestoneTestTriggers.createTestMilestone(milestoneType as any);
  };

  (window as any).triggerRandomMilestone = () => {
    return MilestoneTestTriggers.getRandomMilestone();
  };

  (window as any).triggerCompletionMilestone = (percentage: number) => {
    return MilestoneTestTriggers.createCompletionMilestone(percentage);
  };
}

export default MilestoneTestTriggers;