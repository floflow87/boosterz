import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { showTrophyUnlockAnimation } from '@/lib/trophyAnimations';

interface UnlockTrophyData {
  trophyId: string;
  category: string;
  color: string;
}

interface UnlockTrophyResponse {
  id?: number;
  userId?: number;
  trophyId: string;
  category: string;
  color: string;
  isNew: boolean;
  showAnimation: boolean;
  unlockedAt?: string;
}

export function useTrophyUnlock() {
  const queryClient = useQueryClient();

  const unlockTrophyMutation = useMutation({
    mutationFn: async (data: UnlockTrophyData): Promise<UnlockTrophyResponse> => {
      return await apiRequest('POST', `/api/trophies/unlock`, data);
    },
    onSuccess: (result) => {
      // Invalider les caches liés aux trophées
      queryClient.invalidateQueries({ queryKey: ['/api/trophies/unlocked'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', 'trophy-stats'] });
      
      // Déclencher l'animation si c'est un nouveau trophée
      if (result.isNew && result.showAnimation) {
        showTrophyUnlockAnimation(
          result.trophyId,
          result.category,
          result.color
        );
      }
    },
    onError: (error) => {
      console.error('Failed to unlock trophy:', error);
    }
  });

  return {
    unlockTrophy: unlockTrophyMutation.mutate,
    isUnlocking: unlockTrophyMutation.isPending,
    error: unlockTrophyMutation.error
  };
}

// Helper function to check and unlock trophies based on current stats
export function checkAndUnlockTrophies(
  stats: {
    totalCards: number;
    specialCards: number;
    autographs: number;
    followers: number;
    trades?: number;
  },
  unlockTrophy: (data: UnlockTrophyData) => void
) {
  const { totalCards, specialCards, autographs, followers, trades = 0 } = stats;

  // Collection trophies
  if (totalCards >= 1) unlockTrophy({ trophyId: 'first_card', category: 'collection', color: 'gray' });
  if (totalCards >= 10) unlockTrophy({ trophyId: 'ten_cards', category: 'collection', color: 'green' });
  if (totalCards >= 25) unlockTrophy({ trophyId: 'twentyfive_cards', category: 'collection', color: 'blue' });
  if (totalCards >= 50) unlockTrophy({ trophyId: 'fifty_cards', category: 'collection', color: 'orange' });
  if (totalCards >= 100) unlockTrophy({ trophyId: 'hundred_cards', category: 'collection', color: 'purple' });
  if (totalCards >= 200) unlockTrophy({ trophyId: 'twohundred_cards', category: 'collection', color: 'gold' });
  if (totalCards >= 500) unlockTrophy({ trophyId: 'fivehundred_cards', category: 'collection', color: 'rainbow' });

  // Special cards trophies
  if (specialCards >= 1) unlockTrophy({ trophyId: 'first_special', category: 'specials', color: 'blue' });
  if (specialCards >= 5) unlockTrophy({ trophyId: 'five_specials', category: 'specials', color: 'orange' });
  if (specialCards >= 10) unlockTrophy({ trophyId: 'ten_specials', category: 'specials', color: 'purple' });
  if (specialCards >= 50) unlockTrophy({ trophyId: 'fifty_specials', category: 'specials', color: 'gold' });
  if (specialCards >= 100) unlockTrophy({ trophyId: 'hundred_specials', category: 'specials', color: 'black' });

  // Autograph trophies
  if (autographs >= 1) unlockTrophy({ trophyId: 'first_auto', category: 'autographs', color: 'gray' });
  if (autographs >= 5) unlockTrophy({ trophyId: 'five_autos', category: 'autographs', color: 'green' });
  if (autographs >= 10) unlockTrophy({ trophyId: 'ten_autos', category: 'autographs', color: 'blue' });
  if (autographs >= 25) unlockTrophy({ trophyId: 'twentyfive_autos', category: 'autographs', color: 'orange' });
  if (autographs >= 50) unlockTrophy({ trophyId: 'fifty_autos', category: 'autographs', color: 'purple' });
  if (autographs >= 100) unlockTrophy({ trophyId: 'hundred_autos', category: 'autographs', color: 'gold' });
  if (autographs >= 200) unlockTrophy({ trophyId: 'twohundred_autos', category: 'autographs', color: 'rainbow' });
  if (autographs >= 300) unlockTrophy({ trophyId: 'threehundred_autos', category: 'autographs', color: 'black' });

  // Social trophies
  if (followers >= 1) unlockTrophy({ trophyId: 'first_follower', category: 'social', color: 'gray' });
  if (followers >= 10) unlockTrophy({ trophyId: 'ten_followers', category: 'social', color: 'green' });
  if (followers >= 50) unlockTrophy({ trophyId: 'fifty_followers', category: 'social', color: 'blue' });
  if (followers >= 100) unlockTrophy({ trophyId: 'hundred_followers', category: 'social', color: 'orange' });
  if (followers >= 500) unlockTrophy({ trophyId: 'fivehundred_followers', category: 'social', color: 'purple' });
  if (followers >= 1000) unlockTrophy({ trophyId: 'thousand_followers', category: 'social', color: 'black' });

  // Trading trophies (if applicable)
  if (trades >= 1) unlockTrophy({ trophyId: 'first_trade', category: 'trading', color: 'rainbow' });
  if (trades >= 10) unlockTrophy({ trophyId: 'ten_trades', category: 'trading', color: 'rainbow' });
  if (trades >= 50) unlockTrophy({ trophyId: 'fifty_trades', category: 'trading', color: 'rainbow' });
  if (trades >= 100) unlockTrophy({ trophyId: 'hundred_trades', category: 'trading', color: 'rainbow' });
}