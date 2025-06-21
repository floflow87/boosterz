import { Star, TrendingUp } from "lucide-react";
import CardDisplay from "@/components/card-display";
import type { Card } from "@shared/schema";

interface FeaturedCardsGridProps {
  cards: Card[];
  title?: string;
  maxCards?: number;
  onCardClick?: (card: Card) => void;
  onToggleFeatured?: (cardId: number) => void;
  showManagement?: boolean;
}

export default function FeaturedCardsGrid({
  cards,
  title = "Cartes à la une",
  maxCards = 8,
  onCardClick,
  onToggleFeatured,
  showManagement = false
}: FeaturedCardsGridProps) {
  const featuredCards = cards
    .filter(card => card.isFeatured)
    .slice(0, maxCards);

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-400 fill-current" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <span className="bg-yellow-600 text-white text-sm px-2 py-1 rounded-full">
            {featuredCards.length}
          </span>
        </div>
        
        {showManagement && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <TrendingUp className="w-4 h-4" />
            <span>Cartes mises en avant</span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {featuredCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {featuredCards.map((card) => (
            <CardDisplay
              key={card.id}
              card={card}
              viewMode="grid"
              onCardClick={onCardClick}
              onToggleFeatured={onToggleFeatured}
              showActions={showManagement}
              showTradeInfo={true}
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-yellow-600/50 mx-auto mb-4" />
          <p className="text-yellow-400/70 text-lg">Aucune carte mise à la une</p>
          {showManagement && (
            <p className="text-yellow-500/50 text-sm mt-2">
              Cliquez sur l'étoile d'une carte pour la mettre à la une
            </p>
          )}
        </div>
      )}
    </div>
  );
}