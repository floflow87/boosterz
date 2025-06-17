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
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");
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
    return true;
  });

  const ownedCount = cards?.filter(card => card.isOwned).length || 0;
  const totalCount = cards?.length || 0;
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
                className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 flex items-center space-x-3 border-l-4 ${
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

      <Navigation />
    </div>
  );
}