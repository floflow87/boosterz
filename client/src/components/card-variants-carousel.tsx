import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, HelpCircle } from "lucide-react";
import { Card } from "@shared/schema";

interface CardVariantsCarouselProps {
  baseCard: Card;
  variants: Card[];
  onCardSelect?: (card: Card) => void;
  selectedCardId?: number;
}

const getFormattedCardType = (card: Card) => {
  // Pour les cartes Base selon le sous-type
  if (card.cardType === "Base") {
    if (card.cardSubType === "Swirl") return "Base swirl";
    if (card.cardSubType === "Laser") return "Base laser";
    return "Base";
  }
  
  // Pour les bases numérotées
  if (card.cardType === "Parallel Numbered") {
    return `Base /${card.numbering || "X"}`;
  }
  
  // Pour les inserts
  if (card.cardType?.includes("Insert")) {
    const insertType = card.cardType.replace("Insert ", "").toLowerCase();
    return `Insert ${insertType}`;
  }
  
  // Pour les autographes
  if (card.cardType?.includes("Autograph")) {
    return `Autographe /${card.numbering || "X"}`;
  }
  
  // Défaut
  return card.cardType || "Type inconnu";
};

export default function CardVariantsCarousel({ 
  baseCard, 
  variants, 
  onCardSelect,
  selectedCardId 
}: CardVariantsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Combine base card with variants
  const allCards = [baseCard, ...variants];
  const currentCard = allCards[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? allCards.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === allCards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getVariantLabel = (card: Card) => {
    if (!card.isVariant) return "Base";
    
    switch (card.cardSubType) {
      case "gold": return "Gold";
      case "red": return "Red";
      case "blue": return "Blue";
      case "green": return "Green";
      case "purple": return "Purple";
      case "black": return "Black";
      case "silver": return "Silver";
      case "orange": return "Orange";
      case "pink": return "Pink";
      default: return card.cardSubType || "Variante";
    }
  };

  const getRarityColor = (card: Card) => {
    switch (card.rarity) {
      case "common": return "text-gray-400";
      case "rare": return "text-blue-400";
      case "super_rare": return "text-purple-400";
      case "epic": return "text-orange-400";
      case "legendary": return "text-yellow-400";
      case "mythic": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          {currentCard.playerName} - Variantes ({currentIndex + 1}/{allCards.length})
        </h3>
      </div>

      <div className="flex space-x-4">
        {/* Card Image */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-44 bg-gray-700 rounded-lg overflow-hidden">
            {currentCard.imageUrl ? (
              <>
                <img
                  src={currentCard.imageUrl}
                  alt={`${currentCard.playerName} ${getVariantLabel(currentCard)}`}
                  className="w-full h-full object-cover"
                />
                {currentCard.isOwned && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {currentCard.reference}
                </div>
                {/* Navigation arrows on image */}
                {allCards.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Card Details */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Collection:</span>
              <div className="text-white font-medium">Score Ligue 1</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Saison:</span>
              <div className="text-white font-medium">{currentCard.season || "23/24"}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Type:</span>
              <div className="text-white font-medium">{getFormattedCardType(currentCard)}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Numérotation:</span>
              <div className="text-white font-medium">{currentCard.numbering || "N/A"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Type:</span>
              <div className="text-white font-medium">
                {getVariantLabel(currentCard)}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Rareté:</span>
              <div className={`font-medium capitalize ${getRarityColor(currentCard)}`}>
                {currentCard.rarity || "Common"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Équipe:</span>
              <div className="text-white font-medium">{currentCard.teamName}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Statut:</span>
              <div className={`font-medium ${currentCard.isOwned ? 'text-green-400' : 'text-red-400'}`}>
                {currentCard.isOwned ? 'Possédée' : 'Manquante'}
              </div>
            </div>
          </div>

          {currentCard.serialNumber && (
            <div>
              <span className="text-gray-400 text-sm">Numéro de série:</span>
              <div className="text-white font-medium">{currentCard.serialNumber}</div>
            </div>
          )}

          {onCardSelect && (
            <button
              onClick={() => onCardSelect(currentCard)}
              className={`w-full mt-4 px-4 py-2 rounded-md font-medium transition-colors ${
                selectedCardId === currentCard.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {selectedCardId === currentCard.id ? 'Sélectionnée' : 'Sélectionner cette variante'}
            </button>
          )}
        </div>
      </div>

      {/* Variant indicators */}
      {allCards.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {allCards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-blue-500' 
                  : card.isOwned 
                    ? 'bg-green-500' 
                    : 'bg-gray-600'
              }`}
              title={`${getVariantLabel(card)} - ${card.isOwned ? 'Possédée' : 'Manquante'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}