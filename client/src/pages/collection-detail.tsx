import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Plus, Check, HelpCircle, Grid, List, X, Search, Trash2, Camera, CheckSquare, Square, Users, ChevronLeft, ChevronRight, Minus, Handshake } from "lucide-react";
import Navigation from "@/components/navigation";
import CardPhotoImport from "@/components/card-photo-import";
import CardTradePanel from "@/components/card-trade-panel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";
import logoImage from "@assets/image 29_1750317707391.png";

export default function CollectionDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "bases" | "bases_numbered" | "autographs" | "hits" | "special_1_1">("bases");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullscreenCard, setShowFullscreenCard] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [cardVariantIndexes, setCardVariantIndexes] = useState<Record<string, number>>({});
  const [panStates, setPanStates] = useState<Record<string, { x: number; y: number; scale: number }>>({});
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [selectedTradeCard, setSelectedTradeCard] = useState<Card | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
    queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
  }, [collectionId, queryClient]);

  const updateCardImageMutation = useMutation({
    mutationFn: async ({ cardId, imageUrl }: { cardId: number; imageUrl: string }) => {
      return apiRequest("PATCH", `/api/cards/${cardId}/image`, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
    }
  });

  const toggleOwnershipMutation = useMutation({
    mutationFn: async ({ cardId, isOwned }: { cardId: number; isOwned: boolean }) => {
      return apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
    }
  });

  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
  });

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [collectionId]);

  // Group cards by player and show only one card per player
  const getUniquePlayerCards = () => {
    if (!cards) return [];
    
    const playerGroups = new Map();
    
    cards.forEach(card => {
      const matchesSearch = !searchTerm || 
        card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.reference.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return;

      let includeCard = false;
      switch (filter) {
        case "bases": 
          includeCard = card.cardType === "Base" || card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl";
          break;
        case "bases_numbered": 
          includeCard = card.cardType === "Parallel Numbered";
          break;
        case "autographs": 
          includeCard = card.cardType === "Autograph";
          break;
        case "hits": 
          includeCard = card.cardType.includes("Insert");
          break;
        case "special_1_1": 
          includeCard = card.cardType === "special_1_1" || card.numbering === "1/1";
          break;
        default: 
          includeCard = card.cardType === "Base" || card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl";
      }

      if (includeCard) {
        const playerKey = `${card.playerName}-${card.teamName}`;
        if (!playerGroups.has(playerKey)) {
          playerGroups.set(playerKey, card);
        }
      }
    });
    
    return Array.from(playerGroups.values());
  };

  const filteredCards = getUniquePlayerCards();

  // Calculate numbered bases count (excluding 1/1 cards)
  const numberedBasesCount = cards?.filter(card => 
    card.cardType === "Parallel Numbered" && 
    card.numbering !== "1/1"
  ).length || 0;

  if (collectionLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-white">Collection non trouvée</div>
      </div>
    );
  }

  // Bulk actions functions
  const handleCardSelection = (cardId: number, checked: boolean) => {
    const newSelection = new Set(selectedCards);
    if (checked) {
      newSelection.add(cardId);
    } else {
      newSelection.delete(cardId);
    }
    setSelectedCards(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const handleSelectAll = () => {
    if (!filteredCards) return;
    // Only select the currently visible variant for each player
    const visibleCardIds = new Set(filteredCards.map(card => {
      const variants = getCardVariants(card);
      const playerKey = `${card.playerName}-${card.teamName}`;
      const currentVariantIdx = cardVariantIndexes[playerKey] || 0;
      const currentVariant = variants[currentVariantIdx] || card;
      return currentVariant.id;
    }));
    setSelectedCards(visibleCardIds);
    setShowBulkActions(true);
  };

  const handleDeselectAll = () => {
    setSelectedCards(new Set());
    setShowBulkActions(false);
  };

  const handleBulkMarkAsOwned = async () => {
    try {
      const promises = Array.from(selectedCards).map(cardId => 
        apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned: true })
      );
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      setSelectedCards(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "Cartes marquées comme acquises",
        description: `${selectedCards.size} carte(s) marquée(s) comme acquise(s).`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les cartes.",
        variant: "destructive"
      });
    }
  };

  const handleBulkMarkAsNotOwned = async () => {
    try {
      const promises = Array.from(selectedCards).map(cardId => 
        apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned: false })
      );
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      setSelectedCards(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "Cartes marquées comme manquantes",
        description: `${selectedCards.size} carte(s) marquée(s) comme manquante(s).`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les cartes.",
        variant: "destructive"
      });
    }
  };

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setCurrentVariantIndex(0);
  };

  const handleMarkAsOwned = async (cardId: number, withPhoto: boolean) => {
    try {
      // Update local state immediately for visual feedback
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: true });
      }
      
      await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: true });
      if (withPhoto) {
        setShowPhotoUpload(true);
      }
      toast({
        title: "Carte marquée comme acquise",
        description: "La carte a été marquée comme acquise avec succès."
      });
    } catch (error) {
      // Revert local state on error
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: false });
      }
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme acquise.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsNotOwned = async (cardId: number) => {
    try {
      // Update local state immediately for visual feedback
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: false });
      }
      
      await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: false });
      toast({
        title: "Carte marquée comme manquante",
        description: "La carte a été marquée comme manquante avec succès."
      });
    } catch (error) {
      // Revert local state on error
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: true });
      }
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme manquante.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoSave = (imageUrl: string, cardId?: number) => {
    if (cardId) {
      // Update local state immediately for visual feedback
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, imageUrl });
      }
      updateCardImageMutation.mutate({ cardId, imageUrl });
    }
    setShowPhotoUpload(false);
  };

  const getCardVariants = (card: Card) => {
    if (!cards) return [card];
    
    // Pour les bases, on ne garde que les variantes non-numérotées (Base, Laser, Swirl)
    if (card.cardType === "Base" || card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl") {
      return cards.filter(c => 
        c.playerName === card.playerName && 
        c.teamName === card.teamName &&
        c.collectionId === card.collectionId &&
        (c.cardType === "Base" || c.cardType === "Parallel Laser" || c.cardType === "Parallel Swirl")
      );
    }
    
    // Pour les bases numérotées, on récupère toutes les 9 variantes
    if (card.cardType === "Parallel Numbered") {
      const numberedVariants = cards.filter(c => 
        c.playerName === card.playerName && 
        c.teamName === card.teamName &&
        c.collectionId === card.collectionId &&
        c.cardType === "Parallel Numbered"
      );
      
      // Trier par ordre de rareté: /50, /35, /30, /25, /20, /15 swirl, /15 laser, /10, /5
      return numberedVariants.sort((a, b) => {
        const getRarityOrder = (numbering: string, subType: string) => {
          if (numbering === "1/50") return 1;
          if (numbering === "1/35") return 2;
          if (numbering === "1/30") return 3;
          if (numbering === "1/25") return 4;
          if (numbering === "1/20") return 5;
          if (numbering === "1/15" && subType === "swirl") return 6;
          if (numbering === "1/15" && subType === "laser") return 7;
          if (numbering === "1/10") return 8;
          if (numbering === "1/5") return 9;
          return 10;
        };
        
        const aOrder = getRarityOrder(a.numbering || "", a.cardSubType || "");
        const bOrder = getRarityOrder(b.numbering || "", b.cardSubType || "");
        
        return aOrder - bOrder;
      });
    }
    
    // Pour les hits avec variantes (Base, /15, /10)
    const hitTypes = ["Insert Keepers", "Insert Breakthrough", "Insert Score Team", "Insert Pure Class", "Insert Hot Rookies"];
    if (hitTypes.some(type => card.cardType?.includes(type))) {
      const hitVariants = cards.filter(c => 
        c.playerName === card.playerName && 
        c.teamName === card.teamName &&
        c.collectionId === card.collectionId &&
        c.cardType === card.cardType
      );
      
      // Trier par ordre: Base, /15, /10
      return hitVariants.sort((a, b) => {
        const getVariantOrder = (numbering: string | null) => {
          if (!numbering) return 1; // Base
          if (numbering === "1/15") return 2;
          if (numbering === "1/10") return 3;
          return 4;
        };
        
        return getVariantOrder(a.numbering) - getVariantOrder(b.numbering);
      });
    }
    
    // Pour les autres cartes (autographes, inserts spéciaux), une seule version
    return [card];
  };

  const getCardBorderColor = (card: Card) => {
    if (!card.isOwned) return "border-gray-600";
    
    // Vert pour les bases
    if (card.cardType === "Base" || card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl") {
      return "border-green-500";
    }
    
    // Bleu pour les bases numérotées  
    if (card.cardType === "Parallel Numbered") {
      return "border-blue-500";
    }
    
    // Violet pour les hits (Insert)
    if (card.cardType?.includes("Insert")) {
      return "border-purple-500";
    }
    
    // Gold pour les autographes
    if (card.cardType === "Autograph") {
      return "border-yellow-500";
    }
    
    // Noir pour les spéciales
    if (card.cardType === "special_1_1" || card.numbering === "1/1") {
      return "border-black";
    }
    
    return "border-green-500"; // Default
  };

  const getCardAnimationName = (card: Card) => {
    if (!card.isOwned) return null;
    
    // Vert pour les bases
    if (card.cardType === "Base" || card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl") {
      return "pulse-shadow-green";
    }
    
    // Bleu pour les bases numérotées  
    if (card.cardType === "Parallel Numbered") {
      return "pulse-shadow-blue";
    }
    
    // Violet pour les hits (Insert)
    if (card.cardType?.includes("Insert")) {
      return "pulse-shadow-purple";
    }
    
    // Gold pour les autographes
    if (card.cardType === "Autograph") {
      return "pulse-shadow-yellow";
    }
    
    // Noir pour les spéciales
    if (card.cardType === "special_1_1" || card.numbering === "1/1") {
      return "pulse-shadow-black";
    }
    
    return "pulse-shadow-green"; // Default green
  };

  const getCurrentCard = () => {
    if (!selectedCard) return null;
    const variants = getCardVariants(selectedCard);
    return variants[currentVariantIndex] || selectedCard;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-3 pt-3 pb-20" id="collection-top">
        {/* Collection Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setLocation('/collections')}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors mr-4"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center flex-1">
            <img 
              src={logoImage}
              alt="Ligue 1 Score"
              className="w-20 h-20 object-contain mb-2"
            />
            <p className="text-gray-400 text-sm italic">2023/24</p>
          </div>
        </div>

        {/* Category Tabs - Badge Style */}
        <div className="flex space-x-2 mb-4 overflow-x-auto min-h-[40px] items-center pl-2">
          <button
            onClick={() => setFilter("bases")}
            className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 mr-3 ${
              filter === "bases" 
                ? "text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            style={filter === "bases" ? { backgroundColor: '#F37261' } : {}}
          >
            Bases
          </button>
          <button
            onClick={() => setFilter("bases_numbered")}
            className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "bases_numbered" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Bases numérotées ({numberedBasesCount})
          </button>
          <button
            onClick={() => setFilter("hits")}
            className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "hits" 
                ? "bg-purple-600 text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Hits
          </button>
          <button
            onClick={() => setFilter("autographs")}
            className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "autographs" 
                ? "bg-yellow-600 text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Autographes
          </button>
          <button
            onClick={() => setFilter("special_1_1")}
            className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "special_1_1" 
                ? "bg-black text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Spéciales
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par joueur ou équipe"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 placeholder:text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Photo upload button */}
          <button 
            onClick={() => setShowPhotoUpload(true)}
            className="p-3 rounded-lg transition-colors shadow-lg"
            style={{
              backgroundColor: '#F37261',
              borderColor: '#F37261',
              animation: 'pulse-shadow 2s infinite',
              boxShadow: '0 0 0 0 rgba(243, 114, 97, 0.7)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E65A47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F37261'}
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Selection Controls */}
        {selectedCards.size > 0 ? (
          <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm">
                {selectedCards.size} sélectionnée(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkAsOwned}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Marquer comme acquises"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleBulkMarkAsNotOwned}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Marquer comme manquantes"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleDeselectAll}
                className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                title="Désélectionner tout"
              >
                <Square className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          filteredCards && filteredCards.length > 0 && (
            <div className="mb-4">
              <button
                onClick={handleSelectAll}
                className="text-blue-400 text-sm hover:text-blue-300"
              >
                Tout sélectionner
              </button>
            </div>
          )
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredCards?.map((card) => {
            const variants = getCardVariants(card);
            const playerKey = `${card.playerName}-${card.teamName}`;
            const currentVariantIdx = cardVariantIndexes[playerKey] || 0;
            const currentVariant = variants[currentVariantIdx] || card;
            
            const handleVariantChange = (direction: 'prev' | 'next') => {
              const newIndex = direction === 'prev' 
                ? Math.max(0, currentVariantIdx - 1)
                : Math.min(variants.length - 1, currentVariantIdx + 1);
              setCardVariantIndexes(prev => ({ ...prev, [playerKey]: newIndex }));
              
              // Update selection to reflect the new variant
              const newVariant = variants[newIndex];
              if (selectedCards.has(currentVariant.id) && newVariant) {
                const newSelection = new Set(selectedCards);
                newSelection.delete(currentVariant.id);
                if (newVariant.id !== currentVariant.id) {
                  // Don't auto-select the new variant
                }
                setSelectedCards(newSelection);
                setShowBulkActions(newSelection.size > 0);
              }
            };

            const handleCardPan = (cardId: number, startX: number, startY: number, currentX: number, currentY: number) => {
              const deltaX = currentX - startX;
              const deltaY = currentY - startY;
              const cardKey = `card-${cardId}`;
              
              setPanStates(prev => ({
                ...prev,
                [cardKey]: {
                  x: deltaX,
                  y: deltaY,
                  scale: 1.1
                }
              }));
            };

            const resetCardPan = (cardId: number) => {
              const cardKey = `card-${cardId}`;
              setPanStates(prev => ({
                ...prev,
                [cardKey]: { x: 0, y: 0, scale: 1 }
              }));
            };
            
            // Check if all variants are owned (card is complete)
            const allVariantsOwned = variants.every(variant => variant.isOwned);
            const animationName = getCardAnimationName(currentVariant);
            
            return (
              <div 
                key={playerKey}
                className={`relative bg-gray-800 rounded-xl overflow-hidden border-2 ${getCardBorderColor(currentVariant)}`}
                style={allVariantsOwned && animationName ? {
                  animation: `${animationName} 3s infinite`
                } : {}}
              >
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(currentVariant.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCardSelection(currentVariant.id, e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500"
                  />
                </div>
                
                {/* Variant Navigation */}
                {variants.length > 1 && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1 bg-black bg-opacity-70 rounded-lg px-2 py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVariantChange('prev');
                      }}
                      disabled={currentVariantIdx === 0}
                      className="p-1 text-white disabled:opacity-30 hover:bg-white hover:bg-opacity-20 rounded"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-white text-xs font-medium">
                      {currentVariantIdx + 1}/{variants.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVariantChange('next');
                      }}
                      disabled={currentVariantIdx === variants.length - 1}
                      className="p-1 text-white disabled:opacity-30 hover:bg-white hover:bg-opacity-20 rounded"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {/* Card Type Badge */}
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  {currentVariant.cardType === "Base" ? "Base" : 
                   currentVariant.cardType === "Parallel Laser" ? "Laser" :
                   currentVariant.cardType === "Parallel Swirl" ? "Swirl" : 
                   currentVariant.cardType === "Parallel Numbered" ? 
                     (currentVariant.numbering?.replace("1/", "/") || "Numbered") :
                   currentVariant.cardType}
                </div>
                
                {/* Ownership Status */}
                {currentVariant.isOwned && (
                  <div className="absolute top-8 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Acquise
                  </div>
                )}
                
                {/* Card Content */}
                <div 
                  onClick={() => handleCardSelect(currentVariant)}
                  className="cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  {/* Card Image */}
                  <div className="aspect-[3/4] bg-gray-600 relative">
                    {currentVariant.imageUrl ? (
                      <img 
                        src={currentVariant.imageUrl} 
                        alt={currentVariant.playerName || ""} 
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          touchAction: 'pan-x pan-y',
                          willChange: 'transform',
                          transform: (() => {
                            const cardKey = `card-${currentVariant.id}`;
                            const panState = panStates[cardKey];
                            if (panState) {
                              return `translate(${panState.x * 0.3}px, ${panState.y * 0.3}px) scale(${panState.scale})`;
                            }
                            return 'translate(0px, 0px) scale(1)';
                          })()
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const startX = touch.clientX;
                          const startY = touch.clientY;
                          
                          const handleTouchMove = (moveEvent: TouchEvent) => {
                            const moveTouch = moveEvent.touches[0];
                            handleCardPan(currentVariant.id, startX, startY, moveTouch.clientX, moveTouch.clientY);
                          };
                          
                          const handleTouchEnd = () => {
                            setTimeout(() => resetCardPan(currentVariant.id), 100);
                            document.removeEventListener('touchmove', handleTouchMove);
                            document.removeEventListener('touchend', handleTouchEnd);
                          };
                          
                          document.addEventListener('touchmove', handleTouchMove, { passive: false });
                          document.addEventListener('touchend', handleTouchEnd);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            handleCardPan(currentVariant.id, startX, startY, moveEvent.clientX, moveEvent.clientY);
                          };
                          
                          const handleMouseUp = () => {
                            setTimeout(() => resetCardPan(currentVariant.id), 100);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HelpCircle className="w-12 h-12 text-gray-400 opacity-50" />
                      </div>
                    )}
                    
                    {/* Player Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <div className="text-white font-bold text-sm">
                        {currentVariant.playerName?.toUpperCase() || 'JOUEUR INCONNU'}
                      </div>
                      <div className="text-gray-300 text-xs">
                        {currentVariant.teamName}
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Info */}
                  <div className="p-3">
                    <div className="text-gray-400 text-xs mt-1">
                      {currentVariant.rarity || 'Base'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Référence: {currentVariant.reference}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Navigation />

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {(() => {
              const currentCard = getCurrentCard();
              const variants = getCardVariants(selectedCard);
              
              return (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">
                      {selectedCard.playerName || 'Joueur Inconnu'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {selectedCard.teamName || 'Équipe Inconnue'}
                    </p>
                  </div>

                  {/* Variant Navigation */}
                  {variants.length > 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentVariantIndex(Math.max(0, currentVariantIndex - 1))}
                        disabled={currentVariantIndex === 0}
                        className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-white text-sm">
                        {currentVariantIndex + 1} / {variants.length}
                      </span>
                      <button
                        onClick={() => setCurrentVariantIndex(Math.min(variants.length - 1, currentVariantIndex + 1))}
                        disabled={currentVariantIndex === variants.length - 1}
                        className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Card Image */}
                  <div className="mb-4 relative">
                    {currentCard?.imageUrl ? (
                      <div 
                        className="relative w-full h-80 perspective-1000"
                        style={{ perspective: '1000px' }}
                      >
                        <img 
                          src={currentCard.imageUrl} 
                          alt={`${currentCard.playerName} card`}
                          className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform duration-500"
                          style={{
                            transformStyle: 'preserve-3d',
                            willChange: 'transform'
                          }}
                          onClick={() => setShowFullscreenCard(true)}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            const target = e.currentTarget;
                            if (!target || !e.touches[0]) return;
                            
                            const touch = e.touches[0];
                            const rect = target.getBoundingClientRect();
                            const startX = touch.clientX - rect.left;
                            const startY = touch.clientY - rect.top;
                            let rotateX = 0;
                            let rotateY = 0;
                            
                            const handleTouchMove = (moveEvent: TouchEvent) => {
                              if (!moveEvent.touches[0]) return;
                              const moveTouch = moveEvent.touches[0];
                              const moveX = moveTouch.clientX - rect.left;
                              const moveY = moveTouch.clientY - rect.top;
                              const deltaX = moveX - startX;
                              const deltaY = moveY - startY;
                              rotateY = deltaX * 0.3;
                              rotateX = -deltaY * 0.3;
                              target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                            };
                            
                            const handleTouchEnd = () => {
                              target.style.transform = 'rotateX(0deg) rotateY(0deg)';
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                        <button
                          onClick={() => setShowFullscreenCard(true)}
                          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-75 transition-all z-10"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-80 bg-gray-600 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Carousel arrows aligned with card */}
                    {variants.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentVariantIndex(Math.max(0, currentVariantIndex - 1))}
                          disabled={currentVariantIndex === 0}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => setCurrentVariantIndex(Math.min(variants.length - 1, currentVariantIndex + 1))}
                          disabled={currentVariantIndex === variants.length - 1}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-[hsl(212,23%,69%)]">Référence:</span>
                      <span className="text-white">{selectedCard.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(212,23%,69%)]">Type:</span>
                      <span className="text-white">{currentCard?.cardSubType || "Base"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(212,23%,69%)]">Numérotation:</span>
                      <span className="text-white">{currentCard?.numbering || 'Non numérotée'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(212,23%,69%)]">Statut:</span>
                      <span className={`font-bold ${currentCard?.isOwned ? 'text-green-400' : 'text-red-400'}`}>
                        {currentCard?.isOwned ? 'Acquise' : 'Manquante'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6">
                    <div className="flex gap-2">
                      {!currentCard?.isOwned ? (
                        <button
                          onClick={async () => {
                            try {
                              await handleMarkAsOwned(currentCard?.id || 0, false);
                              // Visual feedback - the status will update automatically via query invalidation
                            } catch (error) {
                              console.error("Error marking card as owned:", error);
                            }
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await handleMarkAsNotOwned(currentCard?.id || 0);
                              // Visual feedback - the status will update automatically via query invalidation
                            } catch (error) {
                              console.error("Error marking card as not owned:", error);
                            }
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const cardInfo = {
                            id: currentCard?.id || 0,
                            playerName: selectedCard.playerName || "Joueur Inconnu",
                            reference: selectedCard.reference,
                            teamName: selectedCard.teamName || "Équipe Inconnue"
                          };
                          setShowPhotoUpload(true);
                        }}
                        className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTradeCard(currentCard || selectedCard);
                          setShowTradePanel(true);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Handshake className="w-4 h-4" />
                      </button>
                      {currentCard?.imageUrl && (
                        <button
                          onClick={async () => {
                            try {
                              await updateCardImageMutation.mutateAsync({
                                cardId: currentCard.id,
                                imageUrl: ""
                              });
                              toast({
                                title: "Photo supprimée",
                                description: "La photo de la carte a été supprimée avec succès."
                              });
                            } catch (error) {
                              toast({
                                title: "Erreur",
                                description: "Impossible de supprimer la photo.",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Fullscreen Card Modal */}
      {showFullscreenCard && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => setShowFullscreenCard(false)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-lg hover:bg-opacity-75 transition-all z-60"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-2xl max-h-full">
            {(() => {
              const currentCard = getCurrentCard();
              return currentCard?.imageUrl ? (
                <div 
                  className="relative w-full h-96 transform-gpu transition-transform duration-300 ease-out"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateY = ((x - centerX) / centerX) * 25;
                    const rotateX = ((centerY - y) / centerY) * 25;
                    
                    e.currentTarget.style.transform = `
                      perspective(1000px) 
                      rotateX(${rotateX}deg) 
                      rotateY(${rotateY}deg)
                      scale(1.05)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
                  }}
                  style={{
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <img 
                    src={currentCard.imageUrl} 
                    alt={currentCard.playerName || "Card"} 
                    className="w-full h-full object-contain rounded-xl shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-700 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-24 h-24 text-gray-400" />
                </div>
              );
            })()}
          </div>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
            <p className="text-sm opacity-75">Bougez votre souris ou doigt pour faire pivoter la carte</p>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      <CardPhotoImport
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onSave={handlePhotoSave}
        availableCards={(filteredCards || []).map(card => ({
          id: card.id,
          cardNumber: card.reference,
          playerName: card.playerName || "Joueur Inconnu",
          teamName: card.teamName || "Équipe Inconnue",
          cardType: card.cardType,
          collectionId: card.collectionId
        }))}
        preselectedCard={selectedCard ? {
          id: selectedCard.id,
          playerName: selectedCard.playerName || "Joueur Inconnu",
          reference: selectedCard.reference,
          teamName: selectedCard.teamName || "Équipe Inconnue"
        } : undefined}
      />
    </div>
  );
}