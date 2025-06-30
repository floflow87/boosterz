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
    if (!personalCards || !Array.isArray(personalCards)) {
      return null;
    }

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

  // Styles néon pour chaque niveau de trophée
  const getNeonStyles = (level: string) => {
    switch (level) {
      case 'rainbow':
        return {
          border: 'border-2 border-transparent',
          shadow: 'shadow-2xl',
          glow: 'drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]',
          background: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
          animation: 'animate-pulse'
        };
      case 'gold':
        return {
          border: 'border-2 border-yellow-400',
          shadow: 'shadow-2xl shadow-yellow-400/50',
          glow: 'drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]',
          background: '',
          animation: 'animate-pulse'
        };
      case 'purple':
        return {
          border: 'border-2 border-purple-400',
          shadow: 'shadow-2xl shadow-purple-400/50',
          glow: 'drop-shadow-[0_0_12px_rgba(167,139,250,0.8)]',
          background: '',
          animation: ''
        };
      case 'blue':
        return {
          border: 'border-2 border-blue-400',
          shadow: 'shadow-2xl shadow-blue-400/50',
          glow: 'drop-shadow-[0_0_12px_rgba(96,165,250,0.8)]',
          background: '',
          animation: ''
        };
      case 'green':
        return {
          border: 'border-2 border-green-400',
          shadow: 'shadow-2xl shadow-green-400/50',
          glow: 'drop-shadow-[0_0_12px_rgba(74,222,128,0.8)]',
          background: '',
          animation: ''
        };
      default:
        return {
          border: 'border-2 border-gray-400',
          shadow: 'shadow-lg shadow-gray-400/30',
          glow: 'drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]',
          background: '',
          animation: ''
        };
    }
  };

  const neonStyle = avatarLevel ? getNeonStyles(avatarLevel) : null;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Effet néon externe - halo de lumière */}
      {avatarLevel && neonStyle && (
        <>
          {/* Halo extérieur */}
          <div className={`absolute -inset-2 rounded-full blur-lg opacity-75 ${neonStyle.animation}`}>
            <div className={`w-full h-full rounded-full ${
              avatarLevel === 'rainbow' 
                ? 'bg-gradient-to-r from-red-400/60 via-yellow-400/60 via-green-400/60 via-blue-400/60 to-purple-400/60' 
                : avatarLevel === 'gold'
                ? 'bg-yellow-400/60'
                : avatarLevel === 'purple'
                ? 'bg-purple-400/60'
                : avatarLevel === 'blue'
                ? 'bg-blue-400/60'
                : avatarLevel === 'green'
                ? 'bg-green-400/60'
                : 'bg-gray-400/40'
            }`}></div>
          </div>
          
          {/* Bordure néon principale */}
          <div className={`absolute inset-0 rounded-full p-0.5 ${neonStyle.animation}`}>
            <div className={`w-full h-full rounded-full ${
              avatarLevel === 'rainbow' 
                ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400' 
                : ''
            } ${neonStyle.border} ${neonStyle.shadow}`}>
              <div className="w-full h-full bg-[hsl(216,46%,13%)] rounded-full"></div>
            </div>
          </div>
        </>
      )}
      
      {/* Avatar principal avec effet de lueur */}
      <div className={`relative w-full h-full rounded-full overflow-hidden ${avatarLevel && neonStyle ? neonStyle.glow : ''}`}>
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
      
      {/* Particules scintillantes pour le niveau rainbow */}
      {avatarLevel === 'rainbow' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}