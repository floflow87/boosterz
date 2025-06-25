import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, Grid, List, ArrowLeft, DollarSign, User, Store } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import type { Card } from "@shared/schema";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterType, setFilterType] = useState<string>("all");

  // Récupérer les cartes en vente depuis l'API marketplace
  const { data: marketplaceCards = [], isLoading, error } = useQuery<Card[]>({
    queryKey: ["/api/cards/marketplace"],
    staleTime: 30000,
  });

  // Filtrer les cartes selon la recherche et le type
  const filteredCards = marketplaceCards.filter(card => {
    const matchesSearch = !searchQuery || 
      card.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.cardType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === "all" || card.cardType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Obtenir les types de cartes uniques pour le filtre
  const cardTypesSet = new Set<string>();
  marketplaceCards.forEach(card => {
    if (card.cardType) {
      cardTypesSet.add(card.cardType);
    }
  });
  const cardTypes = Array.from(cardTypesSet);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] relative overflow-hidden">
      <HaloBlur />
      
      {/* Header avec navigation retour */}
      <div className="relative z-10 px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation('/social')}
              className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center text-white hover:bg-[hsl(214,35%,30%)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Luckiest_Guy']">
                <span className="text-white">BOOSTER</span>
                <span className="text-[hsl(9,85%,67%)]">Z</span>
              </h1>
              <p className="text-gray-400 text-sm">Marché des cartes</p>
            </div>
          </div>
          
          {/* Vue mode toggle */}
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

        {/* Barre de recherche et filtres */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par joueur, équipe ou type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
            />
          </div>

          {/* Filtres par type */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                filterType === "all" 
                  ? "bg-[hsl(9,85%,67%)] text-white" 
                  : "bg-[hsl(214,35%,22%)] text-gray-400 hover:text-white"
              }`}
            >
              Toutes
            </button>
            {cardTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  filterType === type 
                    ? "bg-[hsl(9,85%,67%)] text-white" 
                    : "bg-[hsl(214,35%,22%)] text-gray-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="w-5 h-5 text-[hsl(9,85%,67%)]" />
              <span className="text-white font-medium">
                {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} en vente
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              {marketplaceCards.length} total
            </div>
          </div>
        </div>

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
              {searchQuery || filterType !== "all" ? "Aucune carte trouvée" : "Aucune carte en vente"}
            </div>
            <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed max-w-md mx-auto">
              {searchQuery || filterType !== "all" 
                ? "Essayez de modifier vos critères de recherche." 
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
      </div>

      <Navigation />
    </div>
  );
}