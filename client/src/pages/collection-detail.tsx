import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Search, Filter, Grid, List, Star, Trophy, Zap, Award } from "lucide-react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import type { Collection, Card } from "@shared/schema";

export default function CollectionDetail() {
  const [, params] = useRoute("/collection/:id");
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "owned" | "missing">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const collectionId = params?.id ? parseInt(params.id) : null;

  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
    enabled: !!collectionId,
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
    enabled: !!collectionId,
  });

  const filteredCards = useMemo(() => {
    if (!cards) return [];
    
    let filtered = cards;
    
    // Filter by ownership
    if (selectedFilter === "owned") {
      filtered = filtered.filter(card => card.isOwned);
    } else if (selectedFilter === "missing") {
      filtered = filtered.filter(card => !card.isOwned);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [cards, selectedFilter, searchTerm]);

  const stats = useMemo(() => {
    if (!cards) return { total: 0, owned: 0, missing: 0, completion: 0 };
    
    const total = cards.length;
    const owned = cards.filter(card => card.isOwned).length;
    const missing = total - owned;
    const completion = total > 0 ? Math.round((owned / total) * 100) : 0;
    
    return { total, owned, missing, completion };
  }, [cards]);

  const getCardTypeIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'base':
        return <Star className="w-4 h-4" />;
      case 'rookie':
        return <Trophy className="w-4 h-4" />;
      case 'insert':
        return <Zap className="w-4 h-4" />;
      case 'auto':
        return <Award className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getCardTypeColor = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'base':
        return 'text-blue-400';
      case 'rookie':
        return 'text-yellow-400';
      case 'insert':
        return 'text-purple-400';
      case 'auto':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (collectionLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(9,85%,67%)]"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Collection introuvable</h2>
          <button
            onClick={() => setLocation("/collections")}
            className="bg-[hsl(9,85%,67%)] text-white px-6 py-3 rounded-lg hover:bg-[hsl(9,85%,60%)] transition-colors"
          >
            Retour aux collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(216,46%,13%)] border-b border-[hsl(216,46%,20%)]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLocation("/collections")}
              className="p-2 rounded-lg bg-[hsl(216,46%,20%)] hover:bg-[hsl(216,46%,25%)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{collection.name}</h1>
              <p className="text-sm text-gray-400">{collection.season}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 rounded-lg bg-[hsl(216,46%,20%)] hover:bg-[hsl(216,46%,25%)] transition-colors"
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{stats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.owned}</div>
              <div className="text-xs text-gray-400">Possédées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.missing}</div>
              <div className="text-xs text-gray-400">Manquantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.completion}%</div>
              <div className="text-xs text-gray-400">Complété</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="bg-[hsl(216,46%,20%)] rounded-full h-2">
              <div 
                className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.completion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par joueur, équipe ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[hsl(216,46%,20%)] border border-[hsl(216,46%,25%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
            />
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: "all", label: "Toutes", count: stats.total },
              { key: "owned", label: "Possédées", count: stats.owned },
              { key: "missing", label: "Manquantes", count: stats.missing }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? "bg-[hsl(9,85%,67%)] text-white"
                    : "bg-[hsl(216,46%,20%)] text-gray-300 hover:bg-[hsl(216,46%,25%)]"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid/List */}
      <div className="p-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`bg-[hsl(216,46%,18%)] rounded-lg p-3 border transition-all duration-200 hover:scale-105 ${
                  card.isOwned 
                    ? "border-green-500/50 bg-green-500/10" 
                    : "border-red-500/50 bg-red-500/10"
                }`}
              >
                <div className="aspect-[3/4] bg-[hsl(216,46%,25%)] rounded-lg mb-2 flex items-center justify-center">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={`${card.playerName} card`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-gray-600">?</div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${getCardTypeColor(card.cardType)}`}>
                      {getCardTypeIcon(card.cardType)}
                    </span>
                    <span className="text-xs text-gray-400">#{card.reference}</span>
                  </div>
                  
                  <div className="text-sm font-medium truncate">{card.playerName}</div>
                  <div className="text-xs text-gray-400 truncate">{card.teamName}</div>
                  
                  {card.isOwned && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`bg-[hsl(216,46%,18%)] rounded-lg p-4 border flex items-center space-x-4 ${
                  card.isOwned 
                    ? "border-green-500/50 bg-green-500/10" 
                    : "border-red-500/50 bg-red-500/10"
                }`}
              >
                <div className="w-12 h-16 bg-[hsl(216,46%,25%)] rounded flex items-center justify-center flex-shrink-0">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={`${card.playerName} card`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-lg font-bold text-gray-600">?</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`${getCardTypeColor(card.cardType)}`}>
                      {getCardTypeIcon(card.cardType)}
                    </span>
                    <span className="text-sm text-gray-400">#{card.reference}</span>
                  </div>
                  <div className="font-medium truncate">{card.playerName}</div>
                  <div className="text-sm text-gray-400 truncate">{card.teamName}</div>
                </div>
                
                {card.isOwned && (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">Aucune carte trouvée</div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedFilter("all");
              }}
              className="text-[hsl(9,85%,67%)] hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}