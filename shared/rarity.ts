// Système de rareté pour Score Ligue 1 23/24
export type RarityLevel = 'base' | 'commune' | 'peu_commune' | 'rare' | 'epique' | 'legendaire' | 'unique';

export interface RarityInfo {
  level: RarityLevel;
  label: string;
  labelFr: string;
  color: string;
  bgColor: string;
  order: number;
}

export const RARITY_CONFIG: Record<RarityLevel, RarityInfo> = {
  base: {
    level: 'base',
    label: 'Base',
    labelFr: 'Base',
    color: '#64748b', // gray-500
    bgColor: '#f1f5f9', // gray-100
    order: 1
  },
  commune: {
    level: 'commune',
    label: 'Common',
    labelFr: 'Commune',
    color: '#059669', // emerald-600
    bgColor: '#d1fae5', // emerald-100
    order: 2
  },
  peu_commune: {
    level: 'peu_commune',
    label: 'Uncommon',
    labelFr: 'Peu commune',
    color: '#0284c7', // sky-600
    bgColor: '#e0f2fe', // sky-100
    order: 3
  },
  rare: {
    level: 'rare',
    label: 'Rare',
    labelFr: 'Rare',
    color: '#7c3aed', // violet-600
    bgColor: '#ede9fe', // violet-100
    order: 4
  },
  epique: {
    level: 'epique',
    label: 'Epic',
    labelFr: 'Épique',
    color: '#dc2626', // red-600
    bgColor: '#fef2f2', // red-100
    order: 5
  },
  legendaire: {
    level: 'legendaire',
    label: 'Legendary',
    labelFr: 'Légendaire',
    color: '#ea580c', // orange-600
    bgColor: '#ffedd5', // orange-100
    order: 6
  },
  unique: {
    level: 'unique',
    label: 'Unique',
    labelFr: 'Unique',
    color: '#fbbf24', // amber-400
    bgColor: '#fef3c7', // amber-100
    order: 7
  }
};

/**
 * Détermine la rareté d'une carte basée sur son type et sa numérotation
 */
export function determineRarity(cardType: string, numbering?: string | null): RarityLevel {
  // Spéciales sont forcément uniques
  if (cardType.toLowerCase().includes('special') || cardType === 'special_1_1' || numbering === '1/1') {
    return 'unique';
  }

  // Cas spéciaux pour les cartes de base
  if (cardType === 'base' || cardType === 'Base') {
    return 'base';
  }

  // Cas des autographes - toujours épique ou plus
  if (cardType.toLowerCase().includes('autograph') || cardType.toLowerCase().includes('autographe')) {
    if (!numbering) return 'epique';
    
    const number = extractNumberFromNumbering(numbering);
    if (number === 1) return 'unique';
    if (number <= 5) return 'legendaire';
    if (number <= 10) return 'epique';
    return 'epique'; // Par défaut pour les autographes
  }

  // Cas spéciaux : Intergalactic, Next Up, Pennants = rareté "Rare"
  if (cardType.includes('Intergalactic') || cardType.includes('Next Up') || cardType.includes('Pennant')) {
    return 'rare';
  }

  // Cas des inserts non numérotés
  if (cardType.includes('insert') || cardType.includes('Insert')) {
    if (!numbering || numbering === '/50') {
      return 'commune'; // /50, insert non numérotés
    }
  }

  // Détermine la rareté basée sur la numérotation
  if (numbering) {
    const number = extractNumberFromNumbering(numbering);
    
    if (number === 1) return 'unique';           // /1
    if (number <= 5) return 'legendaire';       // /5
    if (number <= 10) return 'epique';          // /10
    if (number <= 15 || number <= 20) return 'rare'; // /15, /20
    if (number <= 25 || number <= 30 || number <= 35) return 'peu_commune'; // /25, /30, /35
    if (number <= 50) return 'commune';         // /50
  }

  // Par défaut
  return 'base';
}

/**
 * Extrait le numéro de la numérotation (ex: "/25" -> 25, "15/25" -> 25)
 */
function extractNumberFromNumbering(numbering: string): number {
  const match = numbering.match(/\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Obtient les informations de rareté
 */
export function getRarityInfo(rarity: RarityLevel): RarityInfo {
  return RARITY_CONFIG[rarity];
}

/**
 * Obtient toutes les raretés triées par ordre
 */
export function getAllRarities(): RarityInfo[] {
  return Object.values(RARITY_CONFIG).sort((a, b) => a.order - b.order);
}

/**
 * Vérifie si une carte peut avoir des autographes (épique et plus)
 */
export function canHaveAutographs(rarity: RarityLevel): boolean {
  const rarityInfo = getRarityInfo(rarity);
  return rarityInfo.order >= 5; // épique et plus
}