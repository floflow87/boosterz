import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import { Trophy, Star, Award, Target, Zap, Crown, Medal, Flame } from "lucide-react";

// Types pour les trophées
interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'collection' | 'social' | 'trading' | 'achievement';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
}

// Données des trophées (à remplacer par une API)
const getMockTrophies = (): Trophy[] => [
  {
    id: '1',
    title: 'Premier Collectionneur',
    description: 'Créer votre première collection',
    icon: 'trophy',
    rarity: 'common',
    category: 'collection',
    unlocked: true,
    unlockedAt: new Date('2025-01-15')
  },
  {
    id: '2',
    title: 'Perfectionniste',
    description: 'Compléter une collection à 100%',
    icon: 'crown',
    rarity: 'legendary',
    category: 'collection',
    unlocked: true,
    unlockedAt: new Date('2025-02-20')
  },
  {
    id: '3',
    title: 'Explorateur',
    description: 'Découvrir 50 cartes différentes',
    icon: 'star',
    rarity: 'rare',
    category: 'collection',
    unlocked: true,
    progress: 50,
    maxProgress: 50,
    unlockedAt: new Date('2025-01-28')
  },
  {
    id: '4',
    title: 'Sociable',
    description: 'Avoir 10 abonnés',
    icon: 'award',
    rarity: 'rare',
    category: 'social',
    unlocked: false,
    progress: 3,
    maxProgress: 10
  },
  {
    id: '5',
    title: 'Influenceur',
    description: 'Recevoir 100 likes sur vos posts',
    icon: 'flame',
    rarity: 'epic',
    category: 'social',
    unlocked: false,
    progress: 24,
    maxProgress: 100
  },
  {
    id: '6',
    title: 'Maître Échangeur',
    description: 'Réaliser 20 échanges de cartes',
    icon: 'zap',
    rarity: 'epic',
    category: 'trading',
    unlocked: false,
    progress: 2,
    maxProgress: 20
  },
  {
    id: '7',
    title: 'Vitesse de l\'Éclair',
    description: 'Ajouter 10 cartes en moins d\'une heure',
    icon: 'zap',
    rarity: 'rare',
    category: 'achievement',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: '8',
    title: 'Légendaire',
    description: 'Obtenir 5 cartes légendaires',
    icon: 'medal',
    rarity: 'legendary',
    category: 'collection',
    unlocked: false,
    progress: 1,
    maxProgress: 5
  }
];

const getIconComponent = (iconName: string) => {
  const icons = {
    trophy: Trophy,
    star: Star,
    award: Award,
    crown: Crown,
    zap: Zap,
    flame: Flame,
    medal: Medal,
    target: Target
  };
  return icons[iconName as keyof typeof icons] || Trophy;
};

const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600', 
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  };
  return colors[rarity as keyof typeof colors] || colors.common;
};

const getRarityBorder = (rarity: string) => {
  const borders = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500'
  };
  return borders[rarity as keyof typeof borders] || borders.common;
};

export default function Trophies() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Utiliser les données mock pour le moment
  const trophies = getMockTrophies();

  const categories = [
    { id: 'all', name: 'Tous', icon: Trophy },
    { id: 'collection', name: 'Collection', icon: Star },
    { id: 'social', name: 'Social', icon: Award },
    { id: 'trading', name: 'Échanges', icon: Target },
    { id: 'achievement', name: 'Exploits', icon: Zap }
  ];

  const filteredTrophies = selectedCategory === 'all' 
    ? trophies 
    : trophies.filter(trophy => trophy.category === selectedCategory);

  const unlockedCount = trophies.filter(t => t.unlocked).length;
  const totalCount = trophies.length;

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20 relative overflow-hidden">
      <HaloBlur />
      <Header title="Trophées" />
      
      <div className="relative z-10 p-4 space-y-6">
        {/* Statistiques */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Trophy className="w-12 h-12 text-[hsl(9,85%,67%)]" />
            </div>
            <h2 className="text-2xl font-bold font-luckiest text-[hsl(9,85%,67%)]">
              {unlockedCount}/{totalCount}
            </h2>
            <p className="text-[hsl(212,23%,69%)]">Trophées débloqués</p>
            <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[hsl(9,85%,67%)] to-[hsl(9,85%,77%)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-luckiest">Catégories</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[hsl(9,85%,67%)] text-white'
                      : 'bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] hover:bg-[hsl(214,35%,25%)]'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-poppins text-sm">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des trophées */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-luckiest">
            {selectedCategory === 'all' ? 'Tous les trophées' : 
             categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          
          <div className="grid gap-4">
            {filteredTrophies.map((trophy) => {
              const IconComponent = getIconComponent(trophy.icon);
              const isUnlocked = trophy.unlocked;
              
              return (
                <div
                  key={trophy.id}
                  className={`bg-[hsl(214,35%,22%)] rounded-lg p-4 border-2 transition-all ${
                    isUnlocked 
                      ? `${getRarityBorder(trophy.rarity)} shadow-lg` 
                      : 'border-transparent opacity-75'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icône */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isUnlocked 
                        ? `bg-gradient-to-br ${getRarityColor(trophy.rarity)}`
                        : 'bg-[hsl(214,35%,30%)]'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        isUnlocked ? 'text-white' : 'text-[hsl(212,23%,69%)]'
                      }`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold font-poppins ${
                          isUnlocked ? 'text-white' : 'text-[hsl(212,23%,69%)]'
                        }`}>
                          {trophy.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            trophy.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                            trophy.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                            trophy.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {trophy.rarity === 'legendary' ? 'Légendaire' :
                             trophy.rarity === 'epic' ? 'Épique' :
                             trophy.rarity === 'rare' ? 'Rare' : 'Commun'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-[hsl(212,23%,69%)] mb-3">
                        {trophy.description}
                      </p>

                      {/* Progression */}
                      {trophy.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-[hsl(212,23%,69%)]">
                            <span>Progression</span>
                            <span>{trophy.progress || 0}/{trophy.maxProgress}</span>
                          </div>
                          <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isUnlocked 
                                  ? `bg-gradient-to-r ${getRarityColor(trophy.rarity)}`
                                  : 'bg-[hsl(212,23%,69%)]'
                              }`}
                              style={{ 
                                width: `${Math.min(((trophy.progress || 0) / trophy.maxProgress) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Date de déblocage */}
                      {isUnlocked && trophy.unlockedAt && (
                        <p className="text-xs text-[hsl(212,23%,69%)] mt-2">
                          Débloqué le {trophy.unlockedAt.toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}