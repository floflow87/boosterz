import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Package, Layers, Trophy } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import TrophyAvatar from "@/components/TrophyAvatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Collection, PersonalCard } from "@shared/schema";

export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"cards" | "collections" | "deck">("cards");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState('');
  const [saleFilter, setSaleFilter] = useState<'all' | 'available' | 'sold'>('all');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/users/1/collections"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: personalCards = [], isLoading: personalCardsLoading } = useQuery<PersonalCard[]>({
    queryKey: ["/api/personal-cards"],
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === "cards",
  });

  const { data: userDecks = [], isLoading: decksLoading } = useQuery<any[]>({
    queryKey: ["/api/decks"],
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Filtrer les cartes personnelles
  const filteredPersonalCards = personalCards.filter(card => {
    if (saleFilter === 'available') {
      if (!card.isForTrade || !card.tradePrice || card.isSold) return false;
    } else if (saleFilter === 'sold') {
      if (!card.isSold) return false;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const playerMatch = card.playerName?.toLowerCase().includes(query);
      const teamMatch = card.teamName?.toLowerCase().includes(query);
      return playerMatch || teamMatch;
    }
    
    return true;
  });

  const getCollectionCompletion = (collection: Collection) => {
    if (collection.totalCards && collection.ownedCards !== undefined) {
      return {
        totalCards: collection.totalCards,
        ownedCards: collection.ownedCards,
        percentage: Math.round((collection.ownedCards / collection.totalCards) * 100)
      };
    }
    return { totalCards: 0, ownedCards: 0, percentage: 0 };
  };

  if (userLoading || collectionsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title="Mes cartes" />
      
      <main className="relative z-10 px-4 pb-24">
        {/* User Profile Section */}
        {user && (
          <div className="flex flex-col items-center text-center mb-4 mt-2">
            <TrophyAvatar 
              userId={user.id}
              size={64}
              src={user.avatar || undefined}
              alt={user.name}
              className="mb-3 border-4 border-[hsl(9,85%,67%)]"
            />
            <h1 className="text-2xl font-bold text-white font-[Luckiest Guy] tracking-wide">
              {user.name}
            </h1>
            <p className="text-[hsl(212,23%,69%)] text-sm">@{user.username}</p>
            {user.bio && (
              <p className="text-[hsl(212,23%,69%)] text-sm mt-1 max-w-xs">{user.bio}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[hsl(214,35%,22%)] rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "cards"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-[hsl(212,23%,69%)] hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            Cartes
          </button>
          <button
            onClick={() => setActiveTab("collections")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "collections"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-[hsl(212,23%,69%)] hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            Collections
          </button>
          <button
            onClick={() => setActiveTab("deck")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "deck"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-[hsl(212,23%,69%)] hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Decks
          </button>
        </div>

        {/* Cards Tab Content */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une carte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                />
              </div>
              <select
                value={saleFilter}
                onChange={(e) => setSaleFilter(e.target.value as any)}
                className="px-3 py-2 bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
              >
                <option value="all">Toutes</option>
                <option value="available">En vente</option>
                <option value="sold">Vendues</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-2 bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg text-white hover:bg-[hsl(214,35%,30%)] transition-colors"
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
            </div>

            {/* Add Card Button */}
            <div 
              onClick={() => setLocation("/add-card")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-lg">Ajouter une carte</h3>
              <p className="text-[hsl(212,23%,69%)] text-sm">Ajoute une nouvelle carte à ta collection</p>
            </div>

            {/* Cards Grid/List */}
            {personalCardsLoading ? (
              <div className="text-center py-8">
                <div className="text-white">Chargement des cartes...</div>
              </div>
            ) : filteredPersonalCards.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[hsl(212,23%,69%)]">
                  {searchQuery ? "Aucune carte trouvée pour cette recherche" : "Aucune carte trouvée"}
                </div>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                {filteredPersonalCards.map((card) => (
                  <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-xl p-3 border border-[hsl(214,35%,30%)]">
                    <div className="text-white font-medium">{card.playerName}</div>
                    <div className="text-[hsl(212,23%,69%)] text-sm">{card.teamName}</div>
                    {card.tradePrice && (
                      <div className="text-[hsl(9,85%,67%)] text-sm mt-1">{card.tradePrice}€</div>
                    )}
                    {card.isSold && (
                      <div className="text-red-500 text-xs mt-1">Vendue</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Collections</h3>
            
            {/* Add Collection Button */}
            <div 
              onClick={() => setLocation("/add-card")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-lg">Ajouter une collection</h3>
              <p className="text-[hsl(212,23%,69%)] text-sm">Commence une nouvelle collection</p>
            </div>

            {/* Collections List */}
            {collections && collections.length > 0 ? (
              <div className="space-y-3">
                {collections.map((collection) => {
                  const completion = getCollectionCompletion(collection);
                  return (
                    <div 
                      key={collection.id}
                      onClick={() => setLocation(`/collection/${collection.id}`)}
                      className="bg-[hsl(214,35%,22%)] rounded-xl p-4 border border-[hsl(214,35%,30%)] cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-medium">{collection.name}</h4>
                        <span className="text-[hsl(9,85%,67%)] text-sm font-medium">
                          {completion.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2 mb-2">
                        <div 
                          className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completion.percentage}%` }}
                        />
                      </div>
                      <p className="text-[hsl(212,23%,69%)] text-sm">
                        {completion.ownedCards} / {completion.totalCards} cartes
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-[hsl(212,23%,69%)]">Aucune collection trouvée</div>
              </div>
            )}
          </div>
        )}

        {/* Decks Tab Content */}
        {activeTab === "deck" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Decks</h3>
            
            {/* Add Deck Button */}
            <div 
              onClick={() => setLocation("/create-deck")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-lg">Créer un deck</h3>
              <p className="text-[hsl(212,23%,69%)] text-sm">Assemble tes cartes favorites</p>
            </div>

            {/* Decks List */}
            {decksLoading ? (
              <div className="text-center py-8">
                <div className="text-white">Chargement des decks...</div>
              </div>
            ) : userDecks && userDecks.length > 0 ? (
              <div className="space-y-3">
                {userDecks.map((deck) => (
                  <div 
                    key={deck.id}
                    onClick={() => setLocation(`/deck/${deck.id}`)}
                    className="bg-[hsl(214,35%,22%)] rounded-xl p-4 border border-[hsl(214,35%,30%)] cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-white font-medium">{deck.name}</h4>
                      <span className="text-[hsl(9,85%,67%)] text-sm">
                        {deck.cardCount || 0}/12 cartes
                      </span>
                    </div>
                    {deck.description && (
                      <p className="text-[hsl(212,23%,69%)] text-sm">{deck.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-[hsl(212,23%,69%)]">Aucun deck trouvé</div>
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}