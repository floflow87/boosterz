import { useState } from "react";
import { Handshake, Filter, SortAsc } from "lucide-react";
import CardDisplay from "@/components/card-display";
import type { Card } from "@shared/schema";

interface TradeCardListProps {
  cards: Card[];
  title?: string;
  showFilter?: boolean;
  onCardClick?: (card: Card) => void;
  onTradeRequest?: (card: Card) => void;
  emptyMessage?: string;
}

export default function TradeCardList({
  cards,
  title = "Cartes disponibles pour trade",
  showFilter = true,
  onCardClick,
  onTradeRequest,
  emptyMessage = "Aucune carte disponible pour le moment"
}: TradeCardListProps) {
  const [sortBy, setSortBy] = useState<"player" | "team" | "price">("player");
  const [filterType, setFilterType] = useState<"all" | "owned" | "wanted">("all");

  const filteredAndSortedCards = cards
    .filter(card => {
      if (filterType === "owned") return card.isOwned;
      if (filterType === "wanted") return !card.isOwned;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "player":
          return (a.playerName || "").localeCompare(b.playerName || "");
        case "team":
          return (a.teamName || "").localeCompare(b.teamName || "");
        case "price":
          const priceA = parseFloat(a.tradePrice?.replace(/[^0-9.]/g, '') || "0");
          const priceB = parseFloat(b.tradePrice?.replace(/[^0-9.]/g, '') || "0");
          return priceA - priceB;
        default:
          return 0;
      }
    });

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Handshake className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
            {filteredAndSortedCards.length}
          </span>
        </div>

        {showFilter && (
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm"
            >
              <option value="player">Trier par joueur</option>
              <option value="team">Trier par équipe</option>
              <option value="price">Trier par prix</option>
            </select>

            {/* Filter Buttons */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              {[
                { key: "all", label: "Toutes" },
                { key: "owned", label: "Possédées" },
                { key: "wanted", label: "Recherchées" }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key as any)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterType === key
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cards List */}
      {filteredAndSortedCards.length > 0 ? (
        <div className="space-y-3">
          {filteredAndSortedCards.map((card) => (
            <CardDisplay
              key={card.id}
              card={card}
              viewMode="list"
              onCardClick={onCardClick}
              onTradeClick={onTradeRequest}
              showActions={true}
              showTradeInfo={true}
              variant="default"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Handshake className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}