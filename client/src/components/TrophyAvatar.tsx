import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface TrophyAvatarProps {
  userId?: number;
  avatar?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

interface TrophyStats {
  totalCards: number;
  autographs: number;
  specials: number;
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
  const [, setLocation] = useLocation();
  
  // Récupération de l'utilisateur connecté pour vérifier si c'est son propre avatar
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Récupération des statistiques de trophées optimisées
  const { data: trophyStats } = useQuery<TrophyStats>({
    queryKey: userId ? [`/api/users/${userId}/trophy-stats`] : ['/api/users/me/trophy-stats'],
    enabled: !!userId || !!currentUser
  });

  // Vérifier si c'est l'avatar de l'utilisateur connecté
  const isOwnAvatar = currentUser && (!userId || (currentUser as any).id === userId);

  const handleAvatarClick = () => {
    console.log('Avatar clicked:', { userId, currentUserId: (currentUser as any)?.id, isOwnAvatar });
    if (isOwnAvatar) {
      setLocation("/settings/trophees");
    }
  };

  // Calcul du niveau d'avatar
  const avatarLevel = useMemo(() => {
    if (!trophyStats) {
      return null;
    }

    const { totalCards, autographs, specials } = trophyStats as TrophyStats;

    const allMilestones = [
      ...MILESTONE_CONFIG.collection,
      ...MILESTONE_CONFIG.autographs,
      ...MILESTONE_CONFIG.specials
    ];

    let highestColor = null;
    for (const milestone of allMilestones) {
      let currentCount = 0;
      if (milestone.id.includes('card')) currentCount = totalCards;
      else if (milestone.id.includes('auto')) currentCount = autographs;
      else if (milestone.id.includes('special')) currentCount = specials;

      if (currentCount >= milestone.count && milestone.rarity) {
        highestColor = milestone.color;
      }
    }

    return highestColor;
  }, [trophyStats]);

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
    <div 
      className={`relative ${sizeClasses[size]} ${className} ${isOwnAvatar ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
      onClick={isOwnAvatar ? handleAvatarClick : undefined}
    >
      {/* Halo circulaire néon AUTOUR de l'avatar */}
      {avatarLevel && neonStyle && (
        <>
          {/* Halo extérieur - anneau lumineux */}
          <div className={`absolute -inset-4 rounded-full opacity-80 ${neonStyle.animation}`}
               style={{
                 background: `radial-gradient(circle, transparent 40%, ${
                   avatarLevel === 'rainbow' 
                     ? 'rgba(248,113,113,0.4) 50%, rgba(250,204,21,0.4) 55%, rgba(34,197,94,0.4) 60%, rgba(59,130,246,0.4) 65%, rgba(168,85,247,0.4) 70%, transparent 85%'
                     : avatarLevel === 'gold'
                     ? 'rgba(250,204,21,0.6) 50%, rgba(250,204,21,0.3) 65%, transparent 85%'
                     : avatarLevel === 'purple'
                     ? 'rgba(168,85,247,0.6) 50%, rgba(168,85,247,0.3) 65%, transparent 85%'
                     : avatarLevel === 'blue'
                     ? 'rgba(59,130,246,0.6) 50%, rgba(59,130,246,0.3) 65%, transparent 85%'
                     : avatarLevel === 'green'
                     ? 'rgba(34,197,94,0.6) 50%, rgba(34,197,94,0.3) 65%, transparent 85%'
                     : 'rgba(156,163,175,0.4) 50%, rgba(156,163,175,0.2) 65%, transparent 85%'
                 })`,
                 filter: 'blur(8px)'
               }}>
          </div>
          
          {/* Halo moyen - anneau lumineux plus net */}
          <div className={`absolute -inset-2 rounded-full opacity-60 ${neonStyle.animation}`}
               style={{
                 background: `radial-gradient(circle, transparent 35%, ${
                   avatarLevel === 'rainbow' 
                     ? 'rgba(248,113,113,0.5) 45%, rgba(250,204,21,0.5) 50%, rgba(34,197,94,0.5) 55%, rgba(59,130,246,0.5) 60%, rgba(168,85,247,0.5) 65%, transparent 80%'
                     : avatarLevel === 'gold'
                     ? 'rgba(250,204,21,0.7) 45%, rgba(250,204,21,0.4) 60%, transparent 80%'
                     : avatarLevel === 'purple'
                     ? 'rgba(168,85,247,0.7) 45%, rgba(168,85,247,0.4) 60%, transparent 80%'
                     : avatarLevel === 'blue'
                     ? 'rgba(59,130,246,0.7) 45%, rgba(59,130,246,0.4) 60%, transparent 80%'
                     : avatarLevel === 'green'
                     ? 'rgba(34,197,94,0.7) 45%, rgba(34,197,94,0.4) 60%, transparent 80%'
                     : 'rgba(156,163,175,0.5) 45%, rgba(156,163,175,0.3) 60%, transparent 80%'
                 })`,
                 filter: 'blur(4px)'
               }}>
          </div>
        </>
      )}
      
      {/* Avatar principal sans bordure */}
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
      
      {/* Particules scintillantes pour le niveau rainbow */}
      {avatarLevel === 'rainbow' && (
        <div className="absolute -inset-6 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}