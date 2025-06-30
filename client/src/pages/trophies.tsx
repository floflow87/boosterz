import { useMemo } from "react";
import { ArrowLeft, Trophy, Medal, Star, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Configuration des jalons
const MILESTONE_CONFIG = {
  collection: [
    { id: "first_card", count: 1, title: "Première carte", description: "Ajouter votre première carte à votre collection", rarity: "débutant", color: "gray" },
    { id: "ten_cards", count: 10, title: "Collectionneur", description: "Posséder 10 cartes dans votre collection", rarity: "commun", color: "green" },
    { id: "twentyfive_cards", count: 25, title: "Collectionneur Assidu", description: "Posséder 25 cartes dans votre collection", rarity: "avancé", color: "blue" },
    { id: "fifty_cards", count: 50, title: "Expert Collectionneur", description: "Posséder 50 cartes dans votre collection", rarity: "rare", color: "purple" },
    { id: "hundred_cards", count: 100, title: "Maître Collectionneur", description: "Posséder 100 cartes dans votre collection", rarity: "épique", color: "gold" },
    { id: "twohundred_cards", count: 200, title: "Légende Collectionneur", description: "Posséder 200 cartes dans votre collection", rarity: "légendaire", color: "rainbow" },
  ],
  autographs: [
    { id: "first_auto", count: 1, title: "Premier Autographe", description: "Obtenir votre premier autographe", rarity: "débutant", color: "gray" },
    { id: "ten_autos", count: 10, title: "Chasseur d'Autographes", description: "Obtenir 10 autographes", rarity: "commun", color: "green" },
    { id: "twentyfive_autos", count: 25, title: "Expert en Autographes", description: "Obtenir 25 autographes", rarity: "avancé", color: "blue" },
    { id: "fifty_autos", count: 50, title: "Maître des Autographes", description: "Obtenir 50 autographes", rarity: "rare", color: "purple" },
    { id: "hundred_autos", count: 100, title: "Légende des Autographes", description: "Obtenir 100 autographes", rarity: "épique", color: "gold" },
    { id: "twohundred_autos", count: 200, title: "Dieu des Autographes", description: "Obtenir 200 autographes", rarity: "légendaire", color: "rainbow" },
  ],
  specials: [
    { id: "first_special", count: 1, title: "Première Spéciale", description: "Obtenir votre première carte spéciale", rarity: "rare", color: "purple" },
    { id: "ten_specials", count: 10, title: "Chasseur de Spéciales", description: "Obtenir 10 cartes spéciales", rarity: "épique", color: "gold" },
    { id: "fifty_specials", count: 50, title: "Maître des Spéciales", description: "Obtenir 50 cartes spéciales", rarity: "légendaire", color: "rainbow" },
  ],
  social: [
    { id: "first_follower", count: 1, title: "Premier Abonné", description: "Obtenir votre premier abonné", rarity: "légendaire", color: "gray" },
    { id: "ten_followers", count: 10, title: "Influenceur Débutant", description: "Obtenir 10 abonnés", rarity: "légendaire", color: "green" },
    { id: "fifty_followers", count: 50, title: "Influenceur", description: "Obtenir 50 abonnés", rarity: "légendaire", color: "blue" },
    { id: "hundred_followers", count: 100, title: "Star", description: "Obtenir 100 abonnés", rarity: "légendaire", color: "purple" },
    { id: "twohundred_followers", count: 200, title: "Célébrité", description: "Obtenir 200 abonnés", rarity: "légendaire", color: "gold" },
    { id: "fivehundred_followers", count: 500, title: "Légende Sociale", description: "Obtenir 500 abonnés", rarity: "légendaire", color: "rainbow" },
  ]
};

const COLOR_STYLES = {
  gray: { text: "text-gray-400", bg: "bg-gray-400/10", progress: "bg-gray-400" },
  green: { text: "text-green-400", bg: "bg-green-400/10", progress: "bg-green-400" },
  blue: { text: "text-blue-400", bg: "bg-blue-400/10", progress: "bg-blue-400" },
  purple: { text: "text-purple-400", bg: "bg-purple-400/10", progress: "bg-purple-400" },
  gold: { text: "text-yellow-400", bg: "bg-yellow-400/10", progress: "bg-yellow-400" },
  rainbow: { 
    text: "text-transparent bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text", 
    bg: "bg-gradient-to-r from-red-400/10 via-yellow-400/10 via-green-400/10 via-blue-400/10 to-purple-400/10", 
    progress: "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400" 
  }
};

export default function Trophies() {
  const [, setLocation] = useLocation();

  // Récupération des données utilisateur
  const { data: currentUser } = useQuery({
    queryKey: ['/api/users/me'],
  });

  // Récupération des cartes personnelles pour les statistiques
  const { data: personalCards } = useQuery({
    queryKey: ['/api/personal-cards'],
  });

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!personalCards || !Array.isArray(personalCards) || !currentUser) return { totalCards: 0, autographsCount: 0, specialsCount: 0, followersCount: 0 };

    const totalCards = personalCards.length;
    const autographsCount = personalCards.filter((card: any) => card.cardType?.includes('AUTO')).length;
    // Compter les cartes spéciales = toutes les cartes 1/1 (numbering contient "1/1")
    const specialsCount = personalCards.filter((card: any) => card.numbering?.includes('1/1')).length;
    const followersCount = (currentUser as any).followersCount || 0;

    return { totalCards, autographsCount, specialsCount, followersCount };
  }, [personalCards, currentUser]);

  // Calcul du niveau d'avatar
  const avatarLevel = useMemo(() => {
    const allMilestones = [
      ...MILESTONE_CONFIG.collection,
      ...MILESTONE_CONFIG.autographs,
      ...MILESTONE_CONFIG.specials
    ];

    let highestColor = null;
    for (const milestone of allMilestones) {
      let currentCount = 0;
      if (milestone.id.includes('card')) currentCount = stats.totalCards;
      else if (milestone.id.includes('auto')) currentCount = stats.autographsCount;
      else if (milestone.id.includes('special')) currentCount = stats.specialsCount;

      if (currentCount >= milestone.count && milestone.rarity) {
        highestColor = milestone.color;
      }
    }

    return highestColor;
  }, [stats]);

  // Fonction pour calculer la progression d'un jalon
  const getMilestoneProgress = (milestone: any) => {
    let currentCount = 0;
    if (milestone.id.includes('card')) currentCount = stats.totalCards;
    else if (milestone.id.includes('auto')) currentCount = stats.autographsCount;
    else if (milestone.id.includes('special')) currentCount = stats.specialsCount;
    else if (milestone.id.includes('follower')) currentCount = stats.followersCount;

    const progress = Math.min(currentCount, milestone.count);
    const isUnlocked = currentCount >= milestone.count;
    const progressPercentage = (progress / milestone.count) * 100;

    return { progress, isUnlocked, progressPercentage, currentCount };
  };

  // Calcul des statistiques globales
  const allMilestones = [
    ...MILESTONE_CONFIG.collection,
    ...MILESTONE_CONFIG.autographs,
    ...MILESTONE_CONFIG.specials,
    ...MILESTONE_CONFIG.social
  ];

  const unlockedCount = allMilestones.filter(milestone => {
    const { isUnlocked } = getMilestoneProgress(milestone);
    return isUnlocked;
  }).length;

  const totalCount = allMilestones.length;
  const completionRate = Math.round((unlockedCount / totalCount) * 100);

  // Fonction pour rendre une section de trophées
  const renderTrophySection = (milestones: any[], title: string, icon: any) => (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const { progress, isUnlocked, progressPercentage } = getMilestoneProgress(milestone);
          const colorStyle = COLOR_STYLES[milestone.color as keyof typeof COLOR_STYLES];

          return (
            <div
              key={milestone.id}
              className={`p-4 rounded-lg border transition-all ${
                isUnlocked
                  ? `bg-[hsl(214,35%,22%)] border-[hsl(214,35%,25%)] ${colorStyle.bg}`
                  : "bg-[hsl(214,35%,18%)] border-[hsl(214,35%,20%)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-medium ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                    {milestone.title}
                  </h3>
                  {isUnlocked && (
                    <Trophy className={`w-4 h-4 ${colorStyle.text}`} />
                  )}
                </div>
                {milestone.rarity && (
                  <span className={`text-xs px-2 py-1 rounded-full ${colorStyle.bg} ${colorStyle.text}`}>
                    {milestone.rarity}
                  </span>
                )}
              </div>
              
              <p className={`text-sm mb-3 ${isUnlocked ? 'text-[hsl(212,23%,69%)]' : 'text-gray-500'}`}>
                {milestone.description}
              </p>

              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className={isUnlocked ? 'text-[hsl(212,23%,69%)]' : 'text-gray-500'}>
                    Progression
                  </span>
                  <span className={isUnlocked ? 'text-white' : 'text-gray-400'}>
                    {progress}/{milestone.count}
                  </span>
                </div>
                <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isUnlocked ? colorStyle.progress : 'bg-gray-600'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      {/* Header */}
      <div className="sticky top-0 bg-[hsl(216,46%,13%)] border-b border-[hsl(214,35%,22%)] z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation("/settings")}
              className="p-2 rounded-full bg-[hsl(214,35%,22%)] hover:bg-[hsl(214,35%,25%)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Luckiest_Guy']">TROPHÉES</h1>
              <p className="text-sm text-[hsl(212,23%,69%)]">
                {unlockedCount}/{totalCount} jalons atteints ({completionRate}%)
              </p>
            </div>
          </div>
          <div className="relative">
            {/* Avatar avec décoration */}
            <div className="relative w-12 h-12">
              {avatarLevel && (
                <div className={`absolute inset-0 rounded-full p-0.5 ${
                  avatarLevel === 'rainbow' 
                    ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 animate-pulse' 
                    : `border-2 ${COLOR_STYLES[avatarLevel as keyof typeof COLOR_STYLES]?.progress.replace('bg-', 'border-')}`
                }`}>
                  <div className="w-full h-full bg-[hsl(216,46%,13%)] rounded-full"></div>
                </div>
              )}
              <Trophy className="w-8 h-8 text-[hsl(31,84%,55%)] absolute inset-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-[hsl(31,84%,55%)]">{stats.totalCards}</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Cartes</div>
          </div>
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{stats.autographsCount}</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Autos</div>
          </div>
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{stats.specialsCount}</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Spéciales</div>
          </div>
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{stats.followersCount}</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Abonnés</div>
          </div>
        </div>
      </div>

      {/* Progression par catégorie */}
      <div className="px-4 pb-6 space-y-6">
        {/* Collection */}
        {renderTrophySection(
          MILESTONE_CONFIG.collection, 
          "Collection", 
          <Trophy className="w-5 h-5 mr-2 text-[hsl(31,84%,55%)]" />
        )}

        {/* Autographes */}
        {renderTrophySection(
          MILESTONE_CONFIG.autographs, 
          "Autographes", 
          <Medal className="w-5 h-5 mr-2 text-purple-400" />
        )}

        {/* Spéciales */}
        {renderTrophySection(
          MILESTONE_CONFIG.specials, 
          "Spéciales", 
          <Star className="w-5 h-5 mr-2 text-blue-400" />
        )}

        {/* Social */}
        {renderTrophySection(
          MILESTONE_CONFIG.social, 
          "Social", 
          <Award className="w-5 h-5 mr-2 text-green-400" />
        )}
      </div>
    </div>
  );
}