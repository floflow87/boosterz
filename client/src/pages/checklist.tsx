import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Check, X, Eye, Grid, List, Info } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import type { Collection, Card } from "@shared/schema";

export default function Checklist() {
  const params = useParams();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "special">("all");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const { data: collection } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });

  const { data: cards } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
  });

  const filteredCards = cards?.filter((card) => {
    if (filter === "owned") return card.isOwned;
    if (filter === "missing") return !card.isOwned;
    if (filter === "special") {
      // Pour Score Ligue 1: autographes et cartes 1/1
      return card.cardType === "Autograph" || card.serialNumber === "/1" || card.serialNumber === "1/1";
    }
    return true;
  });

  const ownedCount = cards?.filter(card => card.isOwned).length || 0;
  const totalCount = cards?.length || 0;
  const missingCount = totalCount - ownedCount;
  const specialCount = cards?.filter(card => 
    card.cardType === "Autograph" || card.serialNumber === "/1" || card.serialNumber === "1/1"
  ).length || 0;
  const completionPercentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <Header title="Checklist" showBackButton />

      <main className="relative z-10 px-4 pb-24">
        {/* Collection Info */}
        {collection && (
          <div className="bg-[hsl(214,35%,22%)] rounded-xl p-4 mb-4 gradient-overlay">
            <h2 className="text-lg font-bold text-white font-luckiest mb-1">{collection.name}</h2>
            <p className="text-[hsl(212,23%,69%)] text-sm font-poppins mb-3">Saison {collection.season}</p>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-poppins">{ownedCount}/{totalCount} cartes</span>
              <span className="text-[hsl(9,85%,67%)] font-bold">{completionPercentage}%</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="progress-bar h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button className="p-2 bg-[hsl(214,35%,22%)] rounded-lg">
            <Eye className="w-4 h-4 text-[hsl(212,23%,69%)]" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto scroll-container">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === "all" 
                ? "bg-[hsl(9,85%,67%)] text-white" 
                : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
            }`}
          >
            Toutes ({totalCount})
          </button>
          <button
            onClick={() => setFilter("owned")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === "owned" 
                ? "bg-[hsl(9,85%,67%)] text-white" 
                : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
            }`}
          >
            Possédées ({ownedCount})
          </button>
          <button
            onClick={() => setFilter("missing")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === "missing" 
                ? "bg-[hsl(9,85%,67%)] text-white" 
                : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
            }`}
          >
            Manquantes ({totalCount - ownedCount})
          </button>
        </div>

        {/* Cards Display */}
        {viewMode === "grid" ? (
          <div className="card-grid">
            {filteredCards?.map((card, index) => (
              <div 
                key={card.id} 
                onClick={() => setSelectedCard(card)}
                className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 relative border-2 transition-all cursor-pointer hover:scale-105 ${
                  card.isOwned 
                    ? "border-green-500 bg-opacity-100" 
                    : "border-gray-600 bg-opacity-50"
                }`}
              >
                <div className="text-center mb-2">
                  <div className="text-lg font-bold text-white font-poppins">
                    {card.cardNumber}
                  </div>
                  <div className={`text-sm ${card.isOwned ? 'text-white' : 'text-[hsl(212,23%,69%)]'} font-poppins`}>
                    {card.isOwned ? card.playerName : '?????'}
                  </div>
                </div>
                
                {card.isOwned && card.imageUrl ? (
                  <div className="w-full h-24 mb-2">
                    <img 
                      src={card.imageUrl} 
                      alt={`${card.playerName} card`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gray-600 rounded mb-2 flex items-center justify-center opacity-50">
                    <span className="text-gray-400 text-xs font-poppins">
                      {card.isOwned ? "Image manquante" : "Non possédée"}
                    </span>
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  {card.isOwned ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
                
                {card.isRookieCard && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-[hsl(9,85%,67%)] text-white text-xs px-2 py-1 rounded font-poppins">
                      RC
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards?.map((card, index) => (
              <div 
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 flex items-center space-x-3 border-l-4 cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors ${
                  card.isOwned ? "border-green-500" : "border-gray-500"
                }`}
              >
                <div className="flex-shrink-0">
                  {card.isOwned ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <X className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 font-poppins">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">
                        {card.cardNumber}
                      </div>
                      <div className={`text-sm ${card.isOwned ? 'text-white' : 'text-[hsl(212,23%,69%)]'}`}>
                        {card.isOwned ? card.playerName : 'Carte manquante'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {card.isRookieCard && (
                        <span className="bg-[hsl(9,85%,67%)] text-white text-xs px-2 py-1 rounded">
                          RC
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        card.isOwned 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-500 text-gray-200"
                      }`}>
                        {card.isOwned ? "Possédée" : "Manquante"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Card Details Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white font-poppins">Détails de la carte</h3>
              <button
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Card Image */}
              <div className="w-full h-48 bg-gray-600 rounded-lg overflow-hidden">
                {selectedCard.isOwned && selectedCard.imageUrl ? (
                  <img 
                    src={selectedCard.imageUrl} 
                    alt={`${selectedCard.playerName} card`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm font-poppins">
                      {selectedCard.isOwned ? "Image non disponible" : "Carte non possédée"}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Card Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Numéro</label>
                  <div className="text-lg font-bold text-white font-poppins">#{selectedCard.cardNumber}</div>
                </div>
                
                <div>
                  <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Joueur</label>
                  <div className="text-white font-poppins">
                    {selectedCard.isOwned ? selectedCard.playerName || "Non spécifié" : "Carte non possédée"}
                  </div>
                </div>
                
                {selectedCard.teamName && selectedCard.isOwned && (
                  <div>
                    <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Équipe</label>
                    <div className="text-white font-poppins">{selectedCard.teamName}</div>
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Type</label>
                  <div className="text-white font-poppins">{selectedCard.cardType}</div>
                </div>
                
                {selectedCard.cardSubType && (
                  <div>
                    <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Sous-type</label>
                    <div className="text-white font-poppins">{selectedCard.cardSubType}</div>
                  </div>
                )}
                
                {selectedCard.rarity && (
                  <div>
                    <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Rareté</label>
                    <div className="text-white font-poppins">{selectedCard.rarity}</div>
                  </div>
                )}
                
                {selectedCard.serialNumber && (
                  <div>
                    <label className="text-xs text-[hsl(212,23%,69%)] font-poppins">Numéro de série</label>
                    <div className="text-white font-poppins">{selectedCard.serialNumber}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                  <span className="text-[hsl(212,23%,69%)] font-poppins">Statut</span>
                  <div className="flex items-center space-x-2">
                    {selectedCard.isOwned ? (
                      <div className="flex items-center space-x-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-poppins">Possédée</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <X className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 font-poppins">Manquante</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedCard.isRookieCard && (
                  <div className="bg-[hsl(9,85%,67%)] text-white text-sm px-3 py-2 rounded-lg text-center font-poppins">
                    🏆 Carte Rookie
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
}