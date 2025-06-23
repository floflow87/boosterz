import { useState, useEffect } from "react";
import { X, Star, Handshake, Share2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card } from "@shared/schema";
import cardDefaultImage from "@assets/f455cf2a-3d9e-456f-a921-3ac0c4507202_1750348552823.png";

interface CardFullscreenModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardFullscreenModal({ card, isOpen, onClose }: CardFullscreenModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoaded(true);
  };

  const cardImage = imageError ? cardDefaultImage : (card.imageUrl || cardDefaultImage);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          perspective: '2000px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Enhanced 3D Card Container */}
        <div 
          className="relative aspect-[2.5/3.5] rounded-2xl overflow-hidden mx-auto"
          style={{
            background: `
              linear-gradient(145deg, #3a3a3a, #1a1a1a),
              linear-gradient(45deg, rgba(255,255,255,0.05), transparent)
            `,
            boxShadow: `
              0 40px 80px rgba(0,0,0,0.8),
              inset 0 2px 0 rgba(255,255,255,0.3),
              inset 0 -2px 0 rgba(0,0,0,0.4),
              0 0 0 2px rgba(255,255,255,0.1),
              0 0 40px rgba(243, 114, 97, 0.3)
            `,
            transform: 'translateZ(40px) rotateY(5deg) rotateX(-2deg)',
            transformStyle: 'preserve-3d',
            animation: 'cardFloat 3s ease-in-out infinite alternate'
          }}
        >
          {/* Card Thickness Effect - Top Edge */}
          <div 
            className="absolute -top-1 left-0 right-0 h-1 rounded-t-2xl"
            style={{
              background: 'linear-gradient(90deg, #4a4a4a, #2a2a2a, #4a4a4a)',
              transform: 'translateZ(8px) rotateX(90deg)',
              transformOrigin: 'bottom'
            }}
          />

          {/* Card Thickness Effect - Right Edge */}
          <div 
            className="absolute top-0 -right-1 bottom-0 w-1 rounded-r-2xl"
            style={{
              background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a, #2a2a2a)',
              transform: 'translateZ(8px) rotateY(-90deg)',
              transformOrigin: 'left'
            }}
          />

          {/* Loading Animation */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 animate-pulse" />
          )}

          {/* Card Image */}
          <img
            src={cardImage}
            alt={`${card.playerName} - ${card.reference}`}
            className={cn(
              "w-full h-full object-cover transition-all duration-700",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Holographic Shine Effect */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `
                linear-gradient(45deg, 
                  transparent 30%, 
                  rgba(255,255,255,0.1) 45%, 
                  rgba(255,255,255,0.3) 50%, 
                  rgba(255,255,255,0.1) 55%, 
                  transparent 70%
                )
              `,
              animation: 'holographicShine 4s ease-in-out infinite'
            }}
          />

          {/* Premium Card Glow */}
          {card.cardType === "AUTO" && (
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(255,215,0,0.2) 0%, transparent 70%)',
                animation: 'goldGlow 2s ease-in-out infinite alternate'
              }}
            />
          )}

          {/* Featured Star */}
          {card.isFeatured && (
            <div className="absolute top-4 right-4 z-10">
              <Star 
                className="w-8 h-8 text-yellow-400 fill-current drop-shadow-lg animate-pulse" 
              />
            </div>
          )}

          {/* Ownership Status */}
          <div className={cn(
            "absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg z-10",
            card.isOwned ? "bg-green-600" : "bg-red-600"
          )}>
            {card.isOwned ? "✓" : "✗"}
          </div>

          {/* Card Details Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{card.playerName}</h2>
            <p className="text-lg text-gray-300 mb-3">{card.teamName}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span className="font-mono">#{card.reference}</span>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-semibold",
                card.cardType === "AUTO" && "bg-yellow-600 text-white",
                card.cardType === "MEMORABILIA" && "bg-purple-600 text-white",
                card.cardType === "BASE" && "bg-blue-600 text-white",
                card.cardType === "ROOKIE" && "bg-green-600 text-white"
              )}>
                {card.cardType}
              </div>
            </div>

            {/* Trade/Sale Info */}
            {card.isForTrade && (
              <div className="mt-3 flex items-center text-blue-400">
                <Handshake className="w-4 h-4 mr-2" />
                <span className="text-sm">Disponible pour échange</span>
                {card.tradePrice && (
                  <span className="ml-2 font-bold text-green-400">{card.tradePrice}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
            <Share2 className="w-4 h-4" />
            Partager
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors">
            <Heart className="w-4 h-4" />
            Favoris
          </button>
        </div>
      </div>


    </div>
  );
}