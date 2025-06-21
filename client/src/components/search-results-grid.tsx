import { Search, Filter, X } from "lucide-react";
import CardDisplay from "@/components/card-display";
import type { Card } from "@shared/schema";

interface SearchResultsGridProps {
  cards: Card[];
  searchTerm: string;
  onCardClick?: (card: Card) => void;
  onClearSearch?: () => void;
  showFilters?: boolean;
  viewMode?: "grid" | "list";
}

export default function SearchResultsGrid({
  cards,
  searchTerm,
  onCardClick,
  onClearSearch,
  showFilters = true,
  viewMode = "list"
}: SearchResultsGridProps) {
  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-400/30 text-yellow-200">{part}</mark> : 
        part
    );
  };

  const getMatchType = (card: Card, term: string) => {
    const lowerTerm = term.toLowerCase();
    if (card.playerName?.toLowerCase().includes(lowerTerm)) return "Joueur";
    if (card.teamName?.toLowerCase().includes(lowerTerm)) return "Équipe";
    if (card.reference.toLowerCase().includes(lowerTerm)) return "Référence";
    if (card.cardType.toLowerCase().includes(lowerTerm)) return "Type";
    return "Autre";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Résultats de recherche</h2>
            <p className="text-sm text-gray-400">
              "{searchTerm}" - {cards.length} résultat{cards.length > 1 ? 's' : ''} trouvé{cards.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>

      {/* Results */}
      {cards.length > 0 ? (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            : "space-y-3"
        }>
          {cards.map((card) => (
            <div key={card.id} className="relative">
              {/* Match type badge for list view */}
              {viewMode === "list" && (
                <div className="absolute -top-2 left-16 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {getMatchType(card, searchTerm)}
                </div>
              )}
              
              <CardDisplay
                card={card}
                viewMode={viewMode}
                onCardClick={onCardClick}
                showActions={false}
                showTradeInfo={true}
                variant="compact"
              />
              
              {/* Highlighted matches overlay for grid view */}
              {viewMode === "grid" && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 rounded-b-lg">
                  <p className="text-xs text-white truncate">
                    {highlightText(card.playerName || "", searchTerm)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Aucun résultat trouvé</p>
          <p className="text-gray-500 text-sm mt-2">
            Essayez un autre terme de recherche
          </p>
        </div>
      )}
    </div>
  );
}