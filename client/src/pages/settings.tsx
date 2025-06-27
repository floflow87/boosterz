import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import TrophiesSection from "@/components/TrophiesSection";
import { UserTrophyStats } from "@/utils/trophySystem";

export default function Settings() {
  const [, setLocation] = useLocation();

  // Mock data pour tester le système de trophées
  const mockUserStats: UserTrophyStats = {
    totalCards: 125,
    totalAutographs: 15,
    totalSpecials: 3,
    totalFollowers: 42
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(216,46%,13%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocation('/collections')}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
              Paramètres
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        <TrophiesSection userStats={mockUserStats} />
      </div>
    </div>
  );
}