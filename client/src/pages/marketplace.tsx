import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, TrendingUp, Store, Users, MessageCircle, DollarSign, User, Grid, List } from "lucide-react";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import type { Card } from "@shared/schema";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("marketplace");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Récupérer les cartes en vente depuis l'API marketplace
  const { data: marketplaceCards = [], isLoading, error } = useQuery<Card[]>({
    queryKey: ["/api/cards/marketplace"],
    staleTime: 30000,
  });

  // Filtrer les cartes selon la recherche
  const filteredCards = marketplaceCards.filter(card => {
    const matchesSearch = !searchQuery || 
      card.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.cardType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] relative overflow-hidden">
      <HaloBlur />
      
      {/* Header with logo */}
      <div className="relative z-10 px-4 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white font-['Luckiest_Guy']">
            <span className="text-white">BOOSTER</span>
            <span className="text-[hsl(9,85%,67%)]">Z</span>
          </h1>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="relative z-10 px-4 mb-6">
        <div className="flex space-x-1 bg-[hsl(214,35%,22%)] rounded-lg p-1">
          <button
            onClick={() => setLocation('/social')}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">À la une</span>
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md bg-[hsl(9,85%,67%)] text-white"
          >
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Sur le marché</span>
          </button>
          <button
            onClick={() => setLocation('/social')}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Découvrir</span>
          </button>
          <button
            onClick={() => setLocation('/social')}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Mes posts</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative z-10 px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par joueur, équipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
          />
        </div>
      </div>

      {/* View mode toggle */}
      <div className="relative z-10 px-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="w-5 h-5 text-[hsl(9,85%,67%)]" />
            <span className="text-white font-medium">
              {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} en vente
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-[hsl(214,35%,22%)] rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-[hsl(9,85%,67%)] text-white" : "text-gray-400 hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 px-4 pb-24">
        {/* Liste des cartes */}
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-2">Erreur de chargement</div>
            <p className="text-gray-400 text-sm">
              Impossible de charger les cartes du marché
            </p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-400 mb-2 text-lg">
              {searchQuery ? "Aucune carte trouvée" : "Aucune carte en vente"}
            </div>
            <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed max-w-md mx-auto">
              {searchQuery 
                ? "Essayez de modifier votre recherche." 
                : "Les cartes mises en vente par les utilisateurs apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"}>
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                className={`bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)] hover:border-[hsl(9,85%,67%)] transition-colors p-4 ${
                  viewMode === "list" ? "flex items-center space-x-4" : ""
                }`}
              >
                {/* Image de la carte */}
                <div className={`bg-gray-600 rounded-md flex items-center justify-center ${
                  viewMode === "grid" ? "aspect-[3/4] mb-3" : "w-20 h-28 flex-shrink-0"
                }`}>
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.playerName || 'Carte'} 
                      className="w-full h-full object-cover rounded-md" 
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center p-2">
                      Photo non disponible
                    </div>
                  )}
                </div>

                {/* Informations de la carte */}
                <div className={`${viewMode === "grid" ? "space-y-2" : "flex-1 space-y-1"}`}>
                  {card.playerName && (
                    <h4 className={`text-white font-medium ${viewMode === "grid" ? "text-sm" : ""}`}>
                      {card.playerName}
                    </h4>
                  )}
                  {card.teamName && (
                    <p className="text-gray-400 text-sm">{card.teamName}</p>
                  )}
                  <p className="text-gray-500 text-sm">{card.cardType}</p>
                  
                  {/* Prix et vendeur */}
                  <div className={`${viewMode === "grid" ? "space-y-1" : "flex items-center justify-between"}`}>
                    {card.tradePrice && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-[hsl(9,85%,67%)]" />
                        <span className="text-[hsl(9,85%,67%)] font-bold">
                          {card.tradePrice}€
                        </span>
                      </div>
                    )}
                    {(card as any).seller && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <User className="w-3 h-3" />
                        <span>par {(card as any).seller.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}