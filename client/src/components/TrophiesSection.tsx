import { Trophy, Award, Users, Star } from "lucide-react";
import { TrophySystem, Trophy as TrophyType, TrophyCategory, UserTrophyStats } from "@/utils/trophySystem";

interface TrophiesSectionProps {
  userStats: UserTrophyStats;
}

const categoryIcons: Record<TrophyCategory, React.ComponentType<any>> = {
  collection: Star,
  autographs: Award,
  specials: Trophy,
  social: Users
};

const categoryNames: Record<TrophyCategory, string> = {
  collection: 'Collection',
  autographs: 'Autographes', 
  specials: 'Spéciales',
  social: 'Social'
};

export default function TrophiesSection({ userStats }: TrophiesSectionProps) {
  const trophies = TrophySystem.calculateAllTrophies(userStats);
  const highestRarity = TrophySystem.getHighestAchievedRarity(trophies);

  const renderTrophyCard = (trophy: TrophyType) => {
    const IconComponent = categoryIcons[trophy.category];
    const categoryName = categoryNames[trophy.category];
    
    return (
      <div key={trophy.category} className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${trophy.currentLevel.rarity === 'legendary' ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500' : 'bg-white/10'}`}>
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: trophy.currentLevel.color === 'rainbow' ? '#fff' : trophy.currentLevel.color }}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">{categoryName}</h3>
            <p className="text-sm text-gray-300">{trophy.currentLevel.title}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{trophy.currentCount}</div>
            {trophy.nextLevel && (
              <div className="text-xs text-gray-400">/{trophy.nextLevel.threshold}</div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progression</span>
            <span>{Math.round(trophy.progress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                trophy.currentLevel.rarity === 'legendary' 
                  ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${trophy.progress}%` }}
            />
          </div>
          {trophy.nextLevel && (
            <p className="text-xs text-gray-400">
              Prochain: {trophy.nextLevel.title}
            </p>
          )}
          {trophy.maxAchieved && (
            <p className="text-xs text-yellow-400 font-medium">
              🏆 Niveau maximum atteint !
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Trophées</h2>
      </div>
      
      {/* Overall Status */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center ${TrophySystem.getAvatarBorderClass(highestRarity)}`}>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Statut Général</h3>
            <p className="text-gray-300">
              {highestRarity === 'legendary' ? 'Légende Vivante' :
               highestRarity === 'epic' ? 'Maître Épique' :
               highestRarity === 'rare' ? 'Collectionneur Rare' :
               highestRarity === 'advanced' ? 'Collectionneur Avancé' :
               highestRarity === 'common' ? 'Collectionneur' :
               highestRarity === 'beginner' ? 'Débutant' : 'Nouveau'}
            </p>
            <div className="text-sm text-gray-400 mt-1">
              Votre plus haut niveau de trophée détermine la bordure de votre avatar
            </div>
          </div>
        </div>
      </div>

      {/* Trophy Categories */}
      <div className="grid grid-cols-1 gap-4">
        {Object.values(trophies).map(renderTrophyCard)}
      </div>
    </div>
  );
}