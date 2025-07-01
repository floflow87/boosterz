import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface TrophyUnlockProps {
  trophyData: {
    id: string;
    rarity: string;
    color: string;
    title: string;
    description: string;
  };
}

const RARITY_COLORS = {
  gray: {
    primary: '#9CA3AF',
    secondary: '#6B7280',
    glow: 'rgba(156, 163, 175, 0.6)'
  },
  green: {
    primary: '#10B981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.6)'
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.6)'
  },
  purple: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    glow: 'rgba(139, 92, 246, 0.6)'
  },
  gold: {
    primary: '#F59E0B',
    secondary: '#D97706',
    glow: 'rgba(245, 158, 11, 0.6)'
  },
  rainbow: {
    primary: 'linear-gradient(45deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6)',
    secondary: 'linear-gradient(45deg, #dc2626, #ea580c, #ca8a04, #16a34a, #0891b2, #2563eb, #7c3aed)',
    glow: 'rgba(139, 92, 246, 0.8)'
  }
};

export default function TrophyUnlock() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState(0); // 0: card, 1: transition, 2: trophy, 3: celebration
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Récupération des données du trophée depuis les paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const trophyData = {
    id: urlParams.get('id') || '',
    rarity: urlParams.get('rarity') || 'gray',
    color: urlParams.get('color') || 'gray',
    title: urlParams.get('title') || 'Nouveau Trophée',
    description: urlParams.get('description') || 'Félicitations !'
  };

  const previousPage = urlParams.get('returnTo') || '/collections';
  const colors = RARITY_COLORS[trophyData.color as keyof typeof RARITY_COLORS] || RARITY_COLORS.gray;

  useEffect(() => {
    // Instant load with optimized sequence
    const preloadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 100); // Minimal preload time
    
    // Fast animation sequence
    const timer1 = setTimeout(() => setStage(1), 600); // Show card for 0.6s
    const timer2 = setTimeout(() => {
      setStage(2);
      generateConfetti(); // Confettis dès l'apparition du trophée
    }, 1000); // Transition at 1s
    const timer3 = setTimeout(() => {
      setStage(3);
    }, 1400); // Trophy celebration at 1.4s

    return () => {
      clearTimeout(preloadTimer);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const generateConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleContinue = () => {
    // Fermer la fenêtre si c'est un popup, sinon rediriger
    if (window.opener) {
      window.close();
    } else {
      setLocation(previousPage);
    }
  };

  const getRarityDisplayName = (rarity: string) => {
    const names: { [key: string]: string } = {
      'gray': 'Débutant',
      'green': 'Commun', 
      'blue': 'Avancé',
      'purple': 'Rare',
      'gold': 'Épique',
      'rainbow': 'Légendaire'
    };
    return names[rarity] || names[trophyData.color] || 'Débutant';
  };

  // Optimized loading screen with instant transition
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white opacity-60"></div>
            </div>
          </div>
          <p className="text-white text-sm opacity-80">🏆 Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center overflow-hidden relative animate-fade-in transition-all duration-1000"
      style={{
        background: stage === 0 ? 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)' 
                  : stage === 1 ? 'linear-gradient(135deg, #1f2937 0%, #374151 40%, #111827 100%)'
                  : stage === 2 ? 'linear-gradient(135deg, #111827 0%, #1f2937 30%, #0f172a 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #111827 20%, #000000 100%)'
      }}
    >


      <div className="text-center">
        {/* Stage 0: Card */}
        {stage === 0 && (
          <div className="transform scale-100 transition-all duration-1000">
            <div className="w-52 h-80 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 rounded-2xl shadow-2xl mx-auto mb-8 flex flex-col items-center justify-center border-4 border-blue-400 relative overflow-hidden animate-[flipY_0.6s_ease-in-out] transform-gpu">
              {/* Holographic effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform rotate-45 animate-pulse" />
              
              {/* Card Content */}
              <div className="relative z-10 text-center p-6">
                {/* Logo/Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <div className="text-white font-bold text-2xl drop-shadow-lg">⚽</div>
                </div>
                
                {/* Title */}
                <div className="text-white font-bold text-xl mb-2 drop-shadow-lg">SCORE</div>
                <div className="text-blue-200 text-lg font-semibold mb-2">Ligue 1</div>
                <div className="text-blue-300 text-sm mb-4">2023/24</div>
                
                {/* Decorative elements */}
                <div className="flex justify-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                </div>
                
                <div className="text-blue-200 text-xs uppercase tracking-wider">Collection</div>
              </div>
              
              {/* Corner effects */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-300 rounded-tl"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-300 rounded-tr"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-300 rounded-bl"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-300 rounded-br"></div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nouvelle carte ajoutée !</h2>
          </div>
        )}

        {/* Stage 1: Transition */}
        {stage === 1 && (
          <div className="transform scale-110 transition-all duration-1000 opacity-50">
            <div className="w-48 h-72 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl mx-auto mb-8 flex items-center justify-center border-4 border-blue-400 animate-pulse">
              <Sparkles className="text-white text-6xl animate-spin" size={60} />
            </div>
          </div>
        )}

        {/* Stage 2 & 3: Trophy */}
        {(stage === 2 || stage === 3) && (
          <div className="transform scale-100 transition-all duration-1000">
            {/* Trophy Container */}
            <div 
              className="relative mx-auto mb-8 flex items-center justify-center"
              style={{ width: '192px', height: '192px' }}
            >
              {/* Glow Effect */}
              <div 
                className={`absolute inset-0 rounded-full ${stage === 3 ? 'animate-pulse' : ''}`}
                style={{
                  background: colors.primary,
                  filter: `blur(20px)`,
                  opacity: stage === 3 ? 0.8 : 0.4
                }}
              />
              
              {/* Trophy Base */}
              <div 
                className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 ${stage === 3 ? 'animate-[trophyGlow_2s_ease-in-out_infinite]' : ''}`}
                style={{
                  background: trophyData.color === 'rainbow' 
                    ? colors.primary 
                    : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  borderColor: colors.primary,
                  boxShadow: `0 0 ${stage === 3 ? '40px' : '20px'} ${colors.glow}`,
                  filter: stage === 3 ? `drop-shadow(0 0 15px ${colors.glow})` : 'none'
                }}
              >
                <Trophy 
                  size={64} 
                  className={`${trophyData.color === 'rainbow' ? 'text-white' : 'text-white'} ${stage === 3 ? 'animate-pulse' : ''}`}
                />
              </div>

              {/* Sparkle Effects */}
              {stage === 3 && (
                <>
                  <Sparkles 
                    className="absolute top-4 right-4 text-yellow-300 animate-[sparkleShine_1.5s_ease-in-out_infinite]" 
                    size={20} 
                  />
                  <Sparkles 
                    className="absolute bottom-4 left-4 text-yellow-300 animate-[sparkleShine_1.8s_ease-in-out_infinite]" 
                    size={16}
                    style={{ animationDelay: '0.5s' }}
                  />
                  <Sparkles 
                    className="absolute top-8 left-8 text-yellow-300 animate-[sparkleShine_1.3s_ease-in-out_infinite]" 
                    size={14}
                    style={{ animationDelay: '1s' }}
                  />
                  <Sparkles 
                    className="absolute bottom-8 right-8 text-yellow-300 animate-[sparkleShine_2s_ease-in-out_infinite]" 
                    size={12}
                    style={{ animationDelay: '1.5s' }}
                  />
                </>
              )}
            </div>

            {/* Trophy Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                🏆 Trophée Débloqué !
              </h1>
              <h2 
                className="text-2xl font-bold mb-2"
                style={{
                  color: trophyData.color === 'rainbow' ? 'transparent' : colors.primary,
                  background: trophyData.color === 'rainbow' ? colors.primary : 'transparent',
                  backgroundClip: trophyData.color === 'rainbow' ? 'text' : 'unset',
                  WebkitBackgroundClip: trophyData.color === 'rainbow' ? 'text' : 'unset'
                }}
              >
                {getRarityDisplayName(trophyData.rarity)}
              </h2>
              <p className="text-sm text-gray-300">{trophyData.description}</p>
            </div>

            {/* Continue Button */}
            {stage === 3 && (
              <Button
                onClick={handleContinue}
                className="bg-[hsl(9,85%,67%)] text-white hover:bg-[hsl(9,85%,62%)] px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105"
              >
                Continuer
              </Button>
            )}
          </div>
        )}
      </div>


    </div>
  );
}