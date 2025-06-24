import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Star, Users, Trophy, ArrowRight } from "lucide-react";

const onboardingSteps = [
  {
    id: 1,
    title: "Bienvenue sur BOOSTERZ !",
    description: "L'application ultime pour collectionner et échanger des cartes",
    icon: Star,
    content: (
      <div className="text-center">
        <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Star className="w-12 h-12 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Prêt à commencer ?</h2>
        <p className="text-gray-300 mb-6">
          Découvre un monde de cartes à collectionner, échange avec d'autres passionnés et construis ta collection de rêve !
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-sm text-gray-300">Interface intuitive</div>
          </div>
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm text-gray-300">Échanges faciles</div>
          </div>
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm text-gray-300">Objectifs et défis</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Construis ta collection",
    description: "Ajoute tes cartes et suis tes progrès",
    icon: Trophy,
    content: (
      <div className="text-center">
        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Gère tes collections</h2>
        <p className="text-gray-300 mb-6">
          Organise tes cartes par collection, marque celles que tu possèdes et suis ton pourcentage de completion !
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-300">Scan ou ajoute tes cartes manuellement</span>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-300">Suis tes progrès en temps réel</span>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-300">Crée des decks personnalisés</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Connecte-toi à la communauté",
    description: "Échange, discute et partage avec d'autres collectionneurs",
    icon: Users,
    content: (
      <div className="text-center">
        <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Rejoins la communauté</h2>
        <p className="text-gray-300 mb-6">
          Découvre d'autres collectionneurs, échange tes cartes et partage tes trouvailles !
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-sm text-gray-300">Chat en temps réel</div>
          </div>
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-sm text-gray-300">Système d'échange</div>
          </div>
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-3xl mb-2">📸</div>
            <div className="text-sm text-gray-300">Partage tes cartes</div>
          </div>
          <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-sm text-gray-300">Classements</div>
          </div>
        </div>
      </div>
    )
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/auth/complete-onboarding", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Bienvenue !",
        description: "Ton aventure BOOSTERZ commence maintenant",
        className: "bg-green-600 text-white border-green-600",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de finaliser l'onboarding",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboardingMutation.mutate();
  };

  const step = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(214,35%,8%)] to-[hsl(214,35%,12%)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4 font-luckiest">BOOSTERZ</h1>
          
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Card */}
        <Card className="bg-[hsl(214,35%,10%)] border-gray-700 shadow-2xl">
          <CardContent className="p-8">
            {step.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={currentStep === 0 ? handleSkip : handlePrevious}
            className="text-gray-400 hover:text-white"
          >
            {currentStep === 0 ? "Passer" : "Précédent"}
          </Button>

          <div className="text-center">
            <div className="text-gray-400 text-sm">
              {currentStep + 1} sur {onboardingSteps.length}
            </div>
          </div>

          <Button
            onClick={handleNext}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            disabled={completeOnboardingMutation.isPending}
          >
            {currentStep === onboardingSteps.length - 1 ? (
              completeOnboardingMutation.isPending ? "Finalisation..." : "Commencer !"
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}