import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, CreditCard, Trophy, TrendingUp } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import type { User } from "@shared/schema";

export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"cards" | "collections" | "deck">("cards");

  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const currentUser = authUser?.user;
  const userId = currentUser?.id;

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: personalCards, isLoading: personalCardsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/personal-cards`],
    enabled: !!userId,
  });

  const { data: userDecks, isLoading: decksLoading } = useQuery({
    queryKey: [`/api/users/${userId}/decks`],
    enabled: !!userId,
  });

  if (userLoading || authLoading) {
    return <LoadingScreen />;
  }

  const handleTabChange = (tab: "cards" | "collections" | "deck") => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title="Mes cartes" />
      <main className="relative z-10 px-4 pb-24">
        {/* User Profile Section */}
        {currentUser && (
          <div className="flex flex-col items-center text-center mb-4 mt-2">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-lg border-2 border-orange-500">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {(currentUser.name || currentUser.username || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-luckiest">{currentUser.name || currentUser.username}</h2>
            <div className="flex items-center space-x-4 text-sm text-[hsl(212,23%,69%)]">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">
                  {personalCards?.filter((card: any) => !card.isSold).length || 0}
                </span>
                <span>cartes</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{userDecks?.length || 0}</span>
                <span>decks</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{user?.followersCount || 0}</span>
                <span>abonnés</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="overflow-x-auto scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex space-x-2 bg-[hsl(214,35%,22%)] rounded-xl p-1 min-w-max">
            <button
              onClick={() => handleTabChange("cards")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "cards" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cartes
            </button>

            <button
              onClick={() => handleTabChange("collections")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "collections" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Collections
            </button>

            <button
              onClick={() => handleTabChange("deck")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "deck" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Decks
            </button>
          </div>
        </div>

        {/* Cards Tab Content */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Cartes</h3>
            
            {personalCardsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(9,85%,67%)] mx-auto"></div>
              </div>
            ) : personalCards && personalCards.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {personalCards.filter((card: any) => !card.isSold).map((card: any) => (
                  <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-3">
                    <h4 className="font-bold text-white text-sm">{card.playerName}</h4>
                    <p className="text-gray-300 text-xs">{card.teamName}</p>
                    {card.tradePrice && (
                      <p className="text-green-400 text-xs mt-1">{card.tradePrice}€</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune carte</div>
                <p className="text-[hsl(212,23%,69%)] text-sm">Ajoutez vos premières cartes pour commencer votre collection.</p>
              </div>
            )}
          </div>
        )}

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Collections</h3>
            
            {/* Score Ligue 1 Collection */}
            <div 
              onClick={() => setLocation("/collection/1")}
              className="bg-[hsl(214,35%,22%)] rounded-xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-[hsl(9,85%,67%)]/50 relative group"
            >
              <div className="bg-[hsl(9,85%,67%)] rounded-lg p-3 mb-3 text-center relative">
                <img 
                  src="/attached_assets/image%2029_1750232088999.png" 
                  alt="Score Ligue 1 logo"
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
                <h3 className="font-bold text-white text-xs font-luckiest">SCORE LIGUE 1</h3>
                <p className="text-xs text-white opacity-90 font-poppins">23/24</p>
              </div>
              
              <div className="text-center mb-3">
                <div className="text-xs text-gray-300 mb-1">
                  <span className="text-[hsl(9,85%,67%)] font-bold">{personalCards?.filter((card: any) => !card.isSold).length || 0}</span> / 2853 cartes
                </div>
                <div className="text-xs text-gray-300">
                  {((personalCards?.filter((card: any) => !card.isSold).length || 0) / 2853 * 100).toFixed(1)}% complété
                </div>
              </div>
              
              <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                <div 
                  className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((personalCards?.filter((card: any) => !card.isSold).length || 0) / 2853 * 100)}%` }}
                />
              </div>
            </div>

            {/* Add Collection Button */}
            <div 
              onClick={() => setLocation("/add-card")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-base">Ajouter une carte</h3>
              <p className="text-sm text-gray-300 font-poppins">Glissez une photo ou ajoutez manuellement</p>
            </div>
          </div>
        )}

        {/* Decks Tab Content */}
        {activeTab === "deck" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Decks</h3>
            
            {decksLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(9,85%,67%)] mx-auto"></div>
              </div>
            ) : userDecks && userDecks.length > 0 ? (
              <div className="space-y-4">
                {userDecks.map((deck: any) => (
                  <div 
                    key={deck.id} 
                    onClick={() => setLocation(`/deck/${deck.id}`)}
                    className="bg-[hsl(214,35%,22%)] rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <h4 className="font-bold text-white text-lg">{deck.name}</h4>
                    <p className="text-gray-300 text-sm">{deck.cardCount || 0}/12 cartes</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucun deck</div>
                <p className="text-[hsl(212,23%,69%)] text-sm">Créez votre premier deck pour organiser vos cartes.</p>
              </div>
            )}
          </div>
        )}

        {/* Floating Add Button */}
        {activeTab === "cards" && (
          <button
            onClick={() => setLocation("/add-card")}
            className="fixed bottom-20 right-4 w-10 h-10 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] active:bg-[hsl(9,85%,55%)] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95"
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(240, 101, 67, 0.25), 0 0 0 0 rgba(240, 101, 67, 0.3)',
            }}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </main>
      
      <Navigation />
    </div>
  );
}