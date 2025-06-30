import { useEffect, useState } from "react";

export default function CardLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Connexion à la base de données...",
    "Chargement des cartes Score Ligue 1...",
    "Traitement des données de collection...",
    "Finalisation du chargement..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 95);
        
        // Changer l'étape en fonction du progrès
        if (newProgress > 75) setCurrentStep(3);
        else if (newProgress > 50) setCurrentStep(2);
        else if (newProgress > 25) setCurrentStep(1);
        else setCurrentStep(0);
        
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[hsl(216,46%,13%)] flex items-center justify-center">
      <div className="text-center p-8 max-w-md mx-auto">
        {/* Logo Score Ligue 1 animé */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#F37261] to-[#e55e4a] rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-2xl font-bold">SL1</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
            BOOSTER<span style={{ color: '#F37261' }}>Z</span>
          </h1>
        </div>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-[#F37261] to-[#e55e4a] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">{Math.round(progress)}% chargé</p>
        </div>

        {/* Étape actuelle */}
        <div className="mb-6">
          <p className="text-white text-lg font-medium mb-2">
            {steps[currentStep]}
          </p>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= currentStep ? 'bg-[#F37261]' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Animation des cartes */}
        <div className="flex justify-center space-x-2 mb-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-8 h-12 bg-gradient-to-b from-gray-600 to-gray-700 rounded-sm"
              style={{
                animation: `float 2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>

        {/* Texte de patience */}
        <p className="text-gray-400 text-sm">
          Chargement de votre collection...
          <br />
          <span className="text-xs">2869 cartes à traiter</span>
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}