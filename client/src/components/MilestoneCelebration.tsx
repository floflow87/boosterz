import { useState, useEffect } from "react";
import { Trophy, Star, Crown, Sparkles, Zap, Award, Gift, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneData {
  type: 'collection' | 'autographs' | 'specials' | 'social';
  count: number;
  collectionName: string;
  achievement: string;
  description: string;
  rarity: 'beginner' | 'common' | 'advanced' | 'rare' | 'epic' | 'legendary';
}

interface MilestoneCelebrationProps {
  milestone: MilestoneData | null;
  onClose: () => void;
}

const getMilestoneConfig = (type: MilestoneData['type'], rarity: MilestoneData['rarity']) => {
  const configs = {
    completion: {
      icon: Trophy,
      colors: {
        common: "from-blue-500 to-blue-700",
        rare: "from-purple-500 to-purple-700", 
        epic: "from-pink-500 to-pink-700",
        legendary: "from-yellow-400 to-yellow-600"
      },
      particles: {
        common: "bg-blue-400",
        rare: "bg-purple-400",
        epic: "bg-pink-400", 
        legendary: "bg-yellow-400"
      }
    },
    streak: {
      icon: Zap,
      colors: {
        common: "from-green-500 to-green-700",
        rare: "from-emerald-500 to-emerald-700",
        epic: "from-teal-500 to-teal-700",
        legendary: "from-cyan-400 to-cyan-600"
      },
      particles: {
        common: "bg-green-400",
        rare: "bg-emerald-400",
        epic: "bg-teal-400",
        legendary: "bg-cyan-400"
      }
    },
    rare_find: {
      icon: Star,
      colors: {
        common: "from-indigo-500 to-indigo-700",
        rare: "from-violet-500 to-violet-700",
        epic: "from-fuchsia-500 to-fuchsia-700",
        legendary: "from-rose-400 to-rose-600"
      },
      particles: {
        common: "bg-indigo-400",
        rare: "bg-violet-400",
        epic: "bg-fuchsia-400",
        legendary: "bg-rose-400"
      }
    },
    first_collection: {
      icon: Crown,
      colors: {
        common: "from-amber-500 to-amber-700",
        rare: "from-orange-500 to-orange-700",
        epic: "from-red-500 to-red-700",
        legendary: "from-yellow-300 to-yellow-500"
      },
      particles: {
        common: "bg-amber-400",
        rare: "bg-orange-400",
        epic: "bg-red-400",
        legendary: "bg-yellow-300"
      }
    },
    speed_collector: {
      icon: Award,
      colors: {
        common: "from-slate-500 to-slate-700",
        rare: "from-zinc-500 to-zinc-700",
        epic: "from-stone-500 to-stone-700",
        legendary: "from-neutral-400 to-neutral-600"
      },
      particles: {
        common: "bg-slate-400",
        rare: "bg-zinc-400",
        epic: "bg-stone-400",
        legendary: "bg-neutral-400"
      }
    }
  };

  return configs[type];
};

export default function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (milestone) {
      setShowCelebration(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false);
        setTimeout(onClose, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  if (!milestone) return null;

  const config = getMilestoneConfig(milestone.type, milestone.rarity);
  const IconComponent = config.icon;
  const gradientColor = config.colors[milestone.rarity];
  const particleColor = config.particles[milestone.rarity];

  // Generate random particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3
  }));

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowCelebration(false);
            setTimeout(onClose, 500);
          }}
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className={`absolute w-2 h-2 ${particleColor} rounded-full`}
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                }}
                animate={{
                  y: [0, -100, -200],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.6 
            }}
            className={`relative bg-gradient-to-br ${gradientColor} rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-2 border-white/20`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle effects around the card */}
            <div className="absolute -top-4 -left-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-white/80" />
              </motion.div>
            </div>
            <div className="absolute -top-4 -right-4">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-6 h-6 text-white/70" />
              </motion.div>
            </div>
            <div className="absolute -bottom-4 -left-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-6 h-6 text-white/60" />
              </motion.div>
            </div>
            <div className="absolute -bottom-4 -right-4">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Target className="w-8 h-8 text-white/80" />
              </motion.div>
            </div>

            {/* Rarity indicator */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <span className={`
                inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${milestone.rarity === 'legendary' ? 'bg-yellow-300/20 text-yellow-200 border border-yellow-300/30' :
                  milestone.rarity === 'epic' ? 'bg-purple-300/20 text-purple-200 border border-purple-300/30' :
                  milestone.rarity === 'rare' ? 'bg-blue-300/20 text-blue-200 border border-blue-300/30' :
                  'bg-gray-300/20 text-gray-200 border border-gray-300/30'}
              `}>
                {milestone.rarity}
              </span>
            </motion.div>

            {/* Main icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 15
              }}
              className="mb-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30"
                >
                  <IconComponent className="w-12 h-12 text-white" />
                </motion.div>
                
                {/* Glow effect */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 w-20 h-20 bg-white/20 rounded-full mx-auto blur-xl"
                />
              </div>
            </motion.div>

            {/* Achievement text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-4"
            >
              <h2 className="text-2xl font-bold text-white mb-2 font-luckiest">
                {milestone.achievement}
              </h2>
              <p className="text-white/90 text-sm leading-relaxed">
                {milestone.description}
              </p>
            </motion.div>

            {/* Collection name and percentage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6"
            >
              <div className="text-white/80 text-sm mb-2">
                Collection: <span className="font-semibold">{milestone.collectionName}</span>
              </div>
              {milestone.percentage > 0 && (
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.percentage}%` }}
                    transition={{ 
                      delay: 1,
                      duration: 1.5,
                      ease: "easeOut"
                    }}
                    className="bg-white h-2 rounded-full"
                  />
                </div>
              )}
              {milestone.percentage > 0 && (
                <div className="text-white/90 text-lg font-bold">
                  {milestone.percentage}% Complete
                </div>
              )}
            </motion.div>

            {/* Close instruction */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-white/60 text-xs"
            >
              Tap anywhere to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}