import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Card } from '@shared/schema';

interface CardFlipModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
}

export function CardFlipModal({ card, isOpen, onClose }: CardFlipModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Start flip animation after modal opens
      const timer = setTimeout(() => {
        setIsFlipped(true);
        // Show details after flip animation completes
        setTimeout(() => setShowDetails(true), 300);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsFlipped(false);
      setShowDetails(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRarityColor = (rarity: string | null) => {
    if (!rarity) return 'from-gray-400 to-gray-600';
    switch (rarity.toLowerCase()) {
      case 'unique': return 'from-gray-800 to-black';
      case 'légendaire': return 'from-yellow-400 to-orange-500';
      case 'épique': return 'from-purple-500 to-purple-700';
      case 'rare': return 'from-orange-500 to-red-600';
      case 'peu commune': return 'from-blue-400 to-blue-600';
      case 'commune': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const formatPrice = (price: string | number | null) => {
    if (!price) return 'Non défini';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${numPrice}€`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X size={32} />
        </button>

        {/* Card flip container */}
        <div className="card-flip-container">
          <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Front of card */}
            <div className="card-flip-front">
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 shadow-2xl">
                <div className="aspect-[3/4] bg-white/10 rounded-lg flex items-center justify-center mb-4">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.playerName || "Carte"}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-white/60 text-center">
                      <div className="text-6xl mb-2">🃏</div>
                      <div className="text-sm">Image non disponible</div>
                    </div>
                  )}
                </div>
                <div className="text-center text-white">
                  <h3 className="text-xl font-bold mb-1">{card.playerName}</h3>
                  <p className="text-white/80">{card.teamName}</p>
                </div>
              </div>
            </div>

            {/* Back of card - details */}
            <div className="card-flip-back">
              <div className={`bg-gradient-to-br ${getRarityColor(card.rarity)} rounded-xl p-6 shadow-2xl h-full`}>
                <div className="text-white h-full flex flex-col">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{card.playerName}</h3>
                    <p className="text-white/90 text-lg">{card.teamName}</p>
                  </div>

                  <div className={`space-y-4 flex-1 ${showDetails ? 'animate-fadeInUp' : 'opacity-0'}`}>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-sm text-white/70">Type de carte</div>
                      <div className="font-semibold">{card.cardType}</div>
                    </div>

                    {card.rarity && (
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-sm text-white/70">Rareté</div>
                        <div className="font-semibold">{card.rarity}</div>
                      </div>
                    )}

                    {card.numbering && (
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-sm text-white/70">Numérotation</div>
                        <div className="font-semibold">{card.numbering}</div>
                      </div>
                    )}

                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-sm text-white/70">Référence</div>
                      <div className="font-semibold">{card.reference}</div>
                    </div>

                    {card.salePrice && (
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-sm text-white/70">Prix de vente</div>
                        <div className="font-semibold text-green-300">{formatPrice(card.salePrice)}</div>
                      </div>
                    )}

                    {card.saleDescription && (
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-sm text-white/70">Description</div>
                        <div className="text-sm leading-relaxed">{card.saleDescription}</div>
                      </div>
                    )}
                  </div>

                  <div className={`text-center mt-4 ${showDetails ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
                    <div className="text-xs text-white/60">
                      Cliquez à l'extérieur pour fermer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />


    </div>
  );
}