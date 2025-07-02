interface TrophyData {
  id: string;
  rarity: string;
  color: string;
  title: string;
  description: string;
}

const TROPHY_DESCRIPTIONS: { [key: string]: string } = {
  // Collection trophies
  'first_card': 'Votre première carte ajoutée !',
  'ten_cards': 'Vous possédez maintenant 10 cartes',
  'twentyfive_cards': 'Vous possédez maintenant 25 cartes',
  'fifty_cards': 'Vous possédez maintenant 50 cartes',
  'hundred_cards': 'Vous possédez maintenant 100 cartes',
  'twohundred_cards': 'Vous possédez maintenant 200 cartes',
  'fivehundred_cards': 'Vous possédez maintenant 500 cartes',
  
  // Special cards trophies
  'first_special': 'Votre première carte spéciale !',
  'five_specials': 'Vous possédez maintenant 5 cartes spéciales',
  'ten_specials': 'Vous possédez maintenant 10 cartes spéciales',
  'fifty_specials': 'Vous possédez maintenant 50 cartes spéciales',
  'hundred_specials': 'Niveau ULTIME : 100 cartes spéciales !',
  
  // Autograph trophies
  'first_auto': 'Votre premier autographe !',
  'five_autos': 'Vous possédez maintenant 5 autographes',
  'ten_autos': 'Vous possédez maintenant 10 autographes',
  'twentyfive_autos': 'Vous possédez maintenant 25 autographes',
  'fifty_autos': 'Vous possédez maintenant 50 autographes',
  'hundred_autos': 'Vous possédez maintenant 100 autographes',
  'twohundred_autos': 'Vous possédez maintenant 200 autographes',
  'threehundred_autos': 'Niveau ULTIME : 300 autographes !',
  
  // Social trophies
  'first_follower': 'Votre premier abonné !',
  'ten_followers': 'Vous avez maintenant 10 abonnés',
  'fifty_followers': 'Vous avez maintenant 50 abonnés',
  'hundred_followers': 'Vous avez maintenant 100 abonnés',
  'fivehundred_followers': 'Vous avez maintenant 500 abonnés',
  'thousand_followers': 'Vous avez maintenant 1000 abonnés',
  
  // Trading trophies
  'first_trade': 'Votre premier échange !',
  'ten_trades': 'Vous avez effectué 10 échanges',
  'fifty_trades': 'Vous avez effectué 50 échanges',
  'hundred_trades': 'Vous avez effectué 100 échanges',
};

const TROPHY_TITLES: { [key: string]: string } = {
  'gray': 'Débutant',
  'green': 'Commun',
  'blue': 'Avancé',
  'orange': 'Rare',
  'purple': 'Épique',
  'gold': 'Légendaire',
  'black': 'Ultime',
  'rainbow': 'Légendaire'
};

/**
 * Ouvre une nouvelle fenêtre avec l'animation de déblocage de trophée
 */
export function showTrophyUnlockAnimation(
  trophyId: string,
  rarity: string,
  color: string,
  returnUrl?: string
): void {
  const currentUrl = window.location.pathname;
  const description = TROPHY_DESCRIPTIONS[trophyId] || 'Nouveau trophée débloqué !';
  const title = TROPHY_TITLES[color] || 'Nouveau Trophée';
  
  const params = new URLSearchParams({
    id: trophyId,
    rarity: rarity,
    color: color,
    title: title,
    description: description,
    returnTo: returnUrl || currentUrl
  });

  // Ouvrir dans une nouvelle fenêtre popup centrée
  const width = 800;
  const height = 600;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const popup = window.open(
    `/trophy-unlock?${params.toString()}`,
    'trophyUnlock',
    `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
  );

  // Focus sur la nouvelle fenêtre
  if (popup) {
    popup.focus();
  }
}

/**
 * Vérifie si un trophée vient d'être débloqué et déclenche l'animation
 */
export function checkAndShowTrophyUnlock(
  newlyUnlockedTrophies: Array<{ trophy_id: string; color: string; category: string }>
): void {
  // Afficher l'animation pour le trophée de plus haut niveau débloqué
  if (newlyUnlockedTrophies.length > 0) {
    const priorityOrder = ['black', 'rainbow', 'gold', 'purple', 'orange', 'blue', 'green', 'gray'];
    
    // Trouver le trophée de plus haute priorité
    const highestTrophy = newlyUnlockedTrophies.reduce((highest, current) => {
      const currentPriority = priorityOrder.indexOf(current.color);
      const highestPriority = priorityOrder.indexOf(highest.color);
      
      return currentPriority < highestPriority ? current : highest;
    });

    showTrophyUnlockAnimation(
      highestTrophy.trophy_id,
      getTrophyRarity(highestTrophy.color),
      highestTrophy.color
    );
  }
}

/**
 * Convertit la couleur en rareté lisible
 */
function getTrophyRarity(color: string): string {
  const rarityMap: { [key: string]: string } = {
    'gray': 'débutant',
    'green': 'commun',
    'blue': 'avancé',
    'orange': 'rare',
    'purple': 'épique',
    'gold': 'légendaire',
    'black': 'ultime',
    'rainbow': 'légendaire'
  };
  
  return rarityMap[color] || 'nouveau';
}