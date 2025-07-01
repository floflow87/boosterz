import { useState } from "react";
import { useLocation } from "wouter";
import { Star, Gift, Trophy, Users, ArrowLeft, Award } from "lucide-react";
import HaloBlur from "@/components/halo-blur";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Star,
      title: "Bienvenue !",
      description: "Quand le digital se met au service de tes collections de cartes : Agrémente ton catalogue grâce à des centaines de collections disponibles !",
      buttonText: "Continuer"
    },
    {
      icon: Users,
      title: "Échange",
      description: "Rejoins une communauté active de collectionneurs et échange tes cartes pour compléter tes collections.",
      buttonText: "Continuer"
    },
    {
      icon: Trophy,
      title: "Prêt à commencer !",
      description: "Ta collection t'attend. Explore, collectionne et deviens le plus gros collectionneur de ton cercle d'amis !",
      buttonText: "Continuer"
    },
    {
      icon: Award,
      title: "Système de Trophées",
      description: "Gagne des trophées en collectionnant des cartes ! Plus tu en as, plus ton avatar brille. Une fois débloqué, un trophée reste acquis pour toujours. Clique sur ton avatar pour voir tes accomplissements.",
      buttonText: "Continuer"
    },
    {
      icon: Gift,
      title: "Félicitations !",
      description: "Commence ton aventure en complétant ton PC avec la checklist de la collection Score Ligue 1 2023/24.",
      buttonText: "Commencer"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Marquer l'utilisateur comme ayant terminé l'onboarding
      localStorage.setItem('onboarding_completed', 'true');
      // Forcer le rechargement de la page pour que le Router détecte le changement
      window.location.href = '/collections';
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden flex flex-col items-center justify-center">
      <HaloBlur />
      
      {/* Back arrow - only show from second slide onwards */}
      {currentStep > 0 && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={handleBack}
            className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
      
      <div className="relative z-10 max-w-md mx-auto px-6 text-center flex-1 flex flex-col justify-center">
        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index <= currentStep ? 'bg-[hsl(9,85%,67%)]' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-[hsl(9,85%,67%)] to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <step.icon className="w-12 h-12 text-white" />
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold mb-4 font-luckiest">
          {step.title}
        </h1>
        
        <p className="text-gray-300 mb-8 leading-relaxed">
          {step.description}
        </p>

        {/* Trophée visual for trophy step */}
        {currentStep === 3 && (
          <div className="mb-6 mt-8">
            <div className="flex justify-center space-x-3 mb-4">
              {/* Exemples d'avatars avec halos - réduits */}
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-500 shadow-md relative">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_6px_1px_rgba(156,163,175,0.5)]"></div>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">Débutant</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border border-green-500 shadow-md relative">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_6px_1px_rgba(34,197,94,0.5)]"></div>
                  </div>
                </div>
                <span className="text-[10px] text-green-400">Commun</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border border-blue-500 shadow-md relative">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_6px_1px_rgba(59,130,246,0.5)]"></div>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400">Avancé</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border border-purple-500 shadow-md relative">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_8px_2px_rgba(147,51,234,0.6)]"></div>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400">Rare</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border border-yellow-500 shadow-md relative">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_10px_2px_rgba(251,191,36,0.7)] animate-pulse"></div>
                  </div>
                </div>
                <span className="text-[10px] text-yellow-400">Épique</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 border border-transparent shadow-md relative">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_12px_3px_rgba(147,51,234,0.8)] animate-pulse"></div>
                  </div>
                </div>
                <span className="text-[10px] bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent font-bold">Légendaire</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur border border-purple-500/30 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">Accomplissement permanent</span>
                <Award className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-[10px] text-gray-300">Tes trophées restent acquis même si tu vends des cartes</p>
            </div>
          </div>
        )}

        {/* Badge for last step */}
        {currentStep === steps.length - 1 && (
          <div className="mb-8">
            <div className="w-20 h-28 mx-auto mb-4 relative">
              <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-lg transform rotate-3 animate-pulse">
                <div className="absolute inset-1 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-black">SCORE</div>
                  <div className="text-xs font-bold text-black">LIGUE 1</div>
                  <div className="text-xs text-black">23/24</div>
                  <div className="w-6 h-6 bg-white rounded-full mt-1 flex items-center justify-center">
                    <span className="text-xs font-bold text-black">⚽</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-semibold inline-block animate-pulse">
              🎁 Checklist de la collection Score Ligue 1 2023/24 disponible
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleNext}
          className="w-full bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          {step.buttonText}
        </button>

        {/* Skip option */}
        {currentStep < steps.length - 1 && (
          <button
            onClick={() => {
              localStorage.setItem('onboarding_completed', 'true');
              window.location.href = '/collections';
            }}
            className="mt-4 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Passer l'introduction
          </button>
        )}
      </div>
      

    </div>
  );
}