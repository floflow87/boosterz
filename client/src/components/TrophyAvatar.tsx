import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface TrophyAvatarProps {
  userId?: number;
  avatar?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Configuration des jalons pour calculer le niveau d'avatar
const MILESTONE_CONFIG = {
  collection: [
    { id: "first_card", count: 1, rarity: "débutant", color: "gray" },
    { id: "ten_cards", count: 10, rarity: "commun", color: "green" },
    { id: "twentyfive_cards", count: 25, rarity: "avancé", color: "blue" },
    { id: "fifty_cards", count: 50, rarity: "rare", color: "purple" },
    { id: "hundred_cards", count: 100, rarity: "épique", color: "gold" },
    { id: "twohundred_cards", count: 200, rarity: "légendaire", color: "rainbow" },
  ],
  autographs: [
    { id: "first_auto", count: 1, rarity: "débutant", color: "gray" },
    { id: "ten_autos", count: 10, rarity: "commun", color: "green" },
    { id: "twentyfive_autos", count: 25, rarity: "avancé", color: "blue" },
    { id: "fifty_autos", count: 50, rarity: "rare", color: "purple" },
    { id: "hundred_autos", count: 100, rarity: "épique", color: "gold" },
    { id: "twohundred_autos", count: 200, rarity: "légendaire", color: "rainbow" },
  ],
  specials: [
    { id: "first_special", count: 1, rarity: "rare", color: "purple" },
    { id: "ten_specials", count: 10, rarity: "épique", color: "gold" },
    { id: "fifty_specials", count: 50, rarity: "légendaire", color: "rainbow" },
  ]
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16",
  xl: "w-20 h-20"
};

export default function TrophyAvatar({ userId, avatar, size = "md", className = "" }: TrophyAvatarProps) {
  // Récupération des cartes personnelles pour calculer le niveau
  const { data: personalCards } = useQuery({
    queryKey: userId ? [`/api/users/${userId}/personal-cards`] : ['/api/personal-cards'],
    enabled: !!userId || true
  });

  // Calcul du niveau d'avatar
  const avatarLevel = useMemo(() => {
    if (!personalCards) return null;

    const totalCards = personalCards.length;
    const autographsCount = personalCards.filter((card: any) => card.cardType?.includes('AUTO')).length;
    const specialsCount = personalCards.filter((card: any) => card.cardType && !card.cardType.includes('AUTO') && card.cardType !== 'BASE').length;

    const allMilestones = [
      ...MILESTONE_CONFIG.collection,
      ...MILESTONE_CONFIG.autographs,
      ...MILESTONE_CONFIG.specials
    ];

    let highestColor = null;
    for (const milestone of allMilestones) {
      let currentCount = 0;
      if (milestone.id.includes('card')) currentCount = totalCards;
      else if (milestone.id.includes('auto')) currentCount = autographsCount;
      else if (milestone.id.includes('special')) currentCount = specialsCount;

      if (currentCount >= milestone.count && milestone.rarity) {
        highestColor = milestone.color;
      }
    }

    return highestColor;
  }, [personalCards]);

  // Générer un gradient d'avatar par défaut si pas d'avatar fourni
  const defaultGradient = `linear-gradient(135deg, #FF6B35, #F7931E)`;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Décoration de niveau */}
      {avatarLevel && (
        <div className={`absolute inset-0 rounded-full p-0.5 ${
          avatarLevel === 'rainbow' 
            ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 animate-pulse' 
            : avatarLevel === 'gold'
            ? 'border-2 border-yellow-400'
            : avatarLevel === 'purple'
            ? 'border-2 border-purple-400'
            : avatarLevel === 'blue'
            ? 'border-2 border-blue-400'
            : avatarLevel === 'green'
            ? 'border-2 border-green-400'
            : 'border-2 border-gray-400'
        }`}>
          <div className="w-full h-full bg-[hsl(216,46%,13%)] rounded-full"></div>
        </div>
      )}
      
      {/* Avatar */}
      <div className="relative w-full h-full rounded-full overflow-hidden">
        {avatar ? (
          <img 
            src={avatar} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ background: defaultGradient }}
          />
        )}
      </div>
    </div>
  );
}