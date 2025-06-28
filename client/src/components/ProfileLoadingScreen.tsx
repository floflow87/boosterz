import { User } from "lucide-react";

export default function ProfileLoadingScreen() {
  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Icône utilisateur animée */}
        <div className="relative flex justify-center">
          <div className="absolute w-20 h-20 border-4 border-[hsl(9,85%,67%)] rounded-full animate-ping opacity-20"></div>
          <div className="absolute w-16 h-16 border-4 border-[hsl(9,85%,67%)] rounded-full animate-pulse opacity-40"></div>
          <div className="relative w-12 h-12 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Texte de chargement */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-luckiest text-white">
            Chargement du profil
          </h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-[hsl(9,85%,67%)] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[hsl(9,85%,67%)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-[hsl(9,85%,67%)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        
        {/* Barre de progression factice */}
        <div className="w-48 h-2 bg-[hsl(214,35%,22%)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[hsl(9,85%,67%)] to-[hsl(20,85%,67%)] rounded-full animate-pulse"></div>
        </div>
        
        <p className="text-[hsl(212,23%,69%)] text-sm">
          Récupération des informations...
        </p>
      </div>
    </div>
  );
}