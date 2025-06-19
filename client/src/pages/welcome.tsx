import { useState } from "react";
import { useLocation } from "wouter";
import { Star, Gift, Trophy, Users } from "lucide-react";
import HaloBlur from "@/components/halo-blur";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Gift,
      title: "Bienvenue !",
      description: "Félicitations ! Vous recevez automatiquement la collection Score Ligue 1 2023/24 pour commencer votre aventure.",
      buttonText: "Continuer"
    },
    {
      icon: Star,
      title: "Collectionnez",
      description: "Découvrez plus de 600 cartes différentes avec des variantes uniques et des cartes spéciales à collectionner.",
      buttonText: "Continuer"
    },
    {
      icon: Users,
      title: "Échangez",
      description: "Rejoignez une communauté active de collectionneurs et échangez vos cartes pour compléter vos collections.",
      buttonText: "Continuer"
    },
    {
      icon: Trophy,
      title: "Prêt à commencer !",
      description: "Votre collection vous attend. Explorez, collectionnez et devenez le meilleur collectionneur !",
      buttonText: "Commencer"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Marquer l'utilisateur comme ayant terminé l'onboarding
      localStorage.setItem('onboarding_completed', 'true');
      setLocation('/collections');
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden flex items-center justify-center">
      <HaloBlur />
      
      <div className="relative z-10 max-w-md mx-auto px-6 text-center">
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

        {/* Special gift animation for first step */}
        {currentStep === 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-semibold inline-block animate-pulse">
              🎁 Collection Score Ligue 1 2023/24 offerte !
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
              setLocation('/collections');
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