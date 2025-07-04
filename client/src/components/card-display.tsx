import { useState, useRef, useEffect } from "react";
import { Star, Handshake, Eye, MoreVertical, Share2, Heart, DollarSign, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card } from "@shared/schema";
import { determineRarity, getRarityInfo } from "@shared/rarity";
import { CardFlipModal } from "./CardFlipModal";
import cardDefaultImage from "@assets/f455cf2a-3d9e-456f-a921-3ac0c4507202_1750348552823.png";
import rookieBadge from "@assets/rc_badge_1751486477447.png";

interface CardDisplayProps {
  card: Card & {
    seller?: {
      id: number;
      name: string;
      username: string;
      avatar?: string;
    };
    soldDate?: string;
    soldPrice?: string;
  };
  viewMode?: "grid" | "list";
  isSelected?: boolean;
  isPulledEffect?: boolean;
  isStarEffect?: boolean;
  onCardClick?: (card: Card) => void;
  onToggleOwnership?: (cardId: number, isOwned: boolean) => void;
  onToggleFeatured?: (cardId: number) => void;
  onTradeClick?: (card: Card) => void;
  onShareClick?: (card: Card) => void;
  onFavoriteClick?: (card: Card) => void;
  showActions?: boolean;
  showTradeInfo?: boolean;
  showStats?: boolean;
  variant?: "default" | "compact" | "detailed";
  context?: "sale" | "collection" | "default";
}

export default function CardDisplay({
  card,
  viewMode = "grid",
  isSelected = false,
  isPulledEffect = false,
  isStarEffect = false,
  onCardClick,
  onToggleOwnership,
  onToggleFeatured,
  onTradeClick,
  onShareClick,
  onFavoriteClick,
  showActions = true,
  showTradeInfo = true,
  showStats = false,
  variant = "default",
  context = "default"
}: CardDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showFlipModal, setShowFlipModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoaded(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFlipModal(true);
    onCardClick?.(card);
  };

  const handleToggleOwnership = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOwnership?.(card.id, !card.isOwned);
  };

  const handleToggleFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFeatured?.(card.id);
  };

  const handleTradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTradeClick?.(card);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(card);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick?.(card);
  };

  const cardImage = imageError ? cardDefaultImage : (card.imageUrl || cardDefaultImage);
  
  // Utilise le nouveau système de rareté
  const rarity = determineRarity(card.cardType, card.numbering);
  const rarityInfo = getRarityInfo(rarity);
  
  const getCardTypeColor = (cardType: string) => {
    // Utilise les couleurs du système de rareté
    return `text-white border border-white/20`;
  };

  const getRarityIndicator = () => {
    if (card.cardType === 'Autographe' || card.cardType.toLowerCase().includes('autograph')) return '✍️';
    if (card.cardType.includes('Insert') || card.cardType.includes('insert')) return '💎';
    if (card.cardType.includes('Numbered') || card.cardType.includes('numbered')) return '🔢';
    if (card.cardType.includes('Parallel') || card.cardType.includes('parallel')) return '🌟';
    return '';
  };

  if (viewMode === "list") {
    return (
      <div
        ref={cardRef}
        className={cn(
          "flex items-center p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-lg group",
          context === "sale" 
            ? "bg-gray-800/40 border-gray-600/30 hover:border-gray-500/50"
            : card.isOwned 
              ? "bg-green-900/20 border-green-500/30 hover:border-green-400/50" 
              : "bg-red-900/20 border-red-500/30 hover:border-red-400/50",
          isSelected && "ring-2 ring-blue-500",
          isPulledEffect && "animate-pulse bg-yellow-400/30 border-yellow-400",
          isStarEffect && "animate-bounce"
        )}
        onClick={handleCardClick}
      >
        {/* Image - Reduced size */}
        <div className="relative w-10 h-12 flex-shrink-0 mr-3">
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-800 rounded animate-pulse" />
          )}
          <img
            src={cardImage}
            alt={`${card.playerName} - ${card.reference}`}
            className={cn(
              "w-full h-full object-cover rounded shadow-md transition-opacity",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {card.isFeatured && (
            <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 fill-current drop-shadow-lg" />
          )}
          {card.isRookieCard && (
            <img 
              src={rookieBadge}
              alt="Rookie Card"
              className="absolute -bottom-1 -right-1 w-4 h-4 drop-shadow-lg"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white truncate">{card.playerName}</h3>
            <span 
              className="px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 font-medium"
              style={{
                color: rarityInfo.color,
                backgroundColor: rarityInfo.bgColor
              }}
            >
              {getRarityIndicator()} {rarityInfo.labelFr}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{card.teamName}</span>
            {context !== "sale" && (
              <span className="font-mono">#{card.reference}</span>
            )}
          </div>
          
          {card.numbering && (
            <div className="text-xs text-orange-400 font-bold mt-1">{card.numbering}</div>
          )}
          
          {card.season && (
            <div className="text-xs text-blue-400 mt-1">Saison {card.season}</div>
          )}

          {/* Trade/Sale Info for List View - Hide for sale context */}
          {showTradeInfo && (card.isForTrade || card.tradePrice) && context !== "sale" && (
            <div className="mt-2 space-y-1">
              {card.isForTrade && card.tradePrice && !card.tradeOnly && (
                <div className="flex items-center text-xs">
                  <Handshake className="w-3 h-3 mr-1 text-blue-400" />
                  <span className="text-blue-400">Vente & Trade</span>
                  <span className="ml-2 text-green-400 font-bold">{card.tradePrice?.replace('$', '')}</span>
                </div>
              )}
              {card.isForTrade && card.tradeOnly && (
                <div className="flex items-center text-xs text-[hsl(9,85%,67%)]">
                  <Handshake className="w-3 h-3 mr-1" />
                  <span>Échange seul</span>
                </div>
              )}
              {card.tradePrice && !card.isForTrade && (
                <div className="flex items-center text-xs">
                  <span className="text-green-400">À vendre:</span>
                  <span className="ml-2 text-green-400 font-bold">{card.tradePrice?.replace('$', '')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions - Hide for sale context */}
        {showActions && context !== "sale" && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleToggleOwnership}
              className={cn(
                "p-2 rounded-full transition-colors",
                card.isOwned 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {card.isOwned ? "✓" : "✗"}
            </button>
            
            {card.isOwned && (
              <button
                onClick={handleToggleFeatured}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  card.isFeatured 
                    ? "text-yellow-400 hover:bg-yellow-400/20" 
                    : "text-gray-400 hover:bg-gray-600"
                )}
              >
                <Star className={cn("w-4 h-4", card.isFeatured && "fill-current")} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div
      ref={cardRef}
      className={cn(
        "relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-y-10",
        isSelected && "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900",
        isPulledEffect && "animate-pulse scale-110 shadow-2xl shadow-yellow-400/50",
        isStarEffect && "animate-bounce"
      )}
      onClick={handleCardClick}
    >
      {/* Card Container */}
      <div className={cn(
        "relative aspect-[2.5/5] rounded-lg overflow-hidden shadow-lg transition-all duration-300",
        card.isOwned 
          ? "ring-2 ring-green-500/50 shadow-green-500/20" 
          : "ring-2 ring-red-500/50 shadow-red-500/20",
        "hover:shadow-xl hover:shadow-white/10"
      )}>
        {/* Image */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
        )}
        
        <img
          src={cardImage}
          alt={`${card.playerName} - ${card.reference}`}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            isImageLoaded ? "opacity-100" : "opacity-0",
            "group-hover:scale-110"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Featured Star - Only for non-sale context */}
        {context !== "sale" && card.isFeatured && (
          <div className="absolute top-2 right-2 z-20">
            <Star 
              className="w-6 h-6 text-yellow-400 fill-current drop-shadow-lg animate-pulse" 
            />
          </div>
        )}

        {/* Rookie Card Badge */}
        {card.isRookieCard && (
          <div className="absolute bottom-2 right-2 z-20">
            <img 
              src={rookieBadge}
              alt="Rookie Card"
              className="w-8 h-8 drop-shadow-lg"
            />
          </div>
        )}

        {/* Sale Status or Ownership Indicator */}
        {context !== "sale" && (
          <div className={cn(
            "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg",
            card.isOwned ? "bg-green-600" : "bg-red-600"
          )}>
            {card.isOwned ? "✓" : "✗"}
          </div>
        )}

        {/* Rarity Badge - Move to right for sale context */}
        <div 
          className={cn(
            "absolute top-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
            context === "sale" ? "right-2" : "left-1/2 transform -translate-x-1/2"
          )}
          style={{
            color: rarityInfo.color,
            backgroundColor: rarityInfo.bgColor
          }}
        >
          {getRarityIndicator()} {rarityInfo.labelFr}
        </div>

        {/* Trade/Sale Info - Show at bottom center */}
        {showTradeInfo && (card.isForTrade || card.tradePrice) && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-center">
              {card.isForTrade && card.tradePrice && !card.tradeOnly ? (
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <Handshake className="w-3 h-3 mr-1" />
                  Vente & Trade
                </div>
              ) : card.isForTrade && card.tradeOnly ? (
                <div className="bg-[hsl(9,85%,67%)] text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <Handshake className="w-3 h-3 mr-1" />
                  Échange seul
                </div>
              ) : card.tradePrice && !card.isForTrade ? (
                <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  Vente
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Price - Show at bottom right */}
        {card.tradePrice && !card.tradeOnly && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/80 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
              {card.tradePrice?.replace('$', '')}
            </span>
          </div>
        )}

        {/* Hover Actions */}
        {showActions && (
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={handleToggleOwnership}
              className={cn(
                "p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110",
                card.isOwned 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {card.isOwned ? "✗" : "✓"}
            </button>

            {card.isOwned && onToggleFeatured && (
              <button
                onClick={handleToggleFeatured}
                className={cn(
                  "p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110",
                  card.isFeatured 
                    ? "bg-yellow-600 hover:bg-yellow-700" 
                    : "bg-gray-600 hover:bg-gray-700"
                )}
              >
                <Star className={cn("w-4 h-4", card.isFeatured && "fill-current")} />
              </button>
            )}

            {onTradeClick && (
              <button
                onClick={handleTradeClick}
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-110"
              >
                <Handshake className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleCardClick}
              className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg transition-all duration-200 hover:scale-110"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="mt-2 text-center">
        <h3 className="font-semibold text-white text-sm truncate">
          {card.playerName}
        </h3>
        <p className="text-gray-400 text-xs truncate">
          {card.teamName}
        </p>
        <p className="font-mono text-gray-500 text-xs">
          #{card.reference}
        </p>
        
        {/* Seller Profile for Sold Cards */}
        {card.isSold && card.seller && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                {card.seller.avatar ? (
                  <img 
                    src={card.seller.avatar} 
                    alt={card.seller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{card.seller.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="text-white text-xs font-medium">{card.seller.name}</p>
                <p className="text-gray-400 text-xs">@{card.seller.username}</p>
              </div>
            </div>
            {card.soldPrice && (
              <p className="text-green-400 text-xs font-semibold mt-1">
                Vendue {card.soldPrice}
              </p>
            )}
            {card.soldDate && (
              <p className="text-gray-500 text-xs">
                {new Date(card.soldDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}
        
        {showStats && (
          <div className="mt-1 flex justify-center gap-2 text-xs">
            {card.numbering && (
              <span className="bg-gray-800 px-2 py-1 rounded">
                {card.numbering}
              </span>
            )}
            {card.rarity && (
              <span className="bg-gray-800 px-2 py-1 rounded">
                {card.rarity}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Card Flip Modal */}
      <CardFlipModal
        card={card}
        isOpen={showFlipModal}
        onClose={() => setShowFlipModal(false)}
      />
    </div>
  );
}