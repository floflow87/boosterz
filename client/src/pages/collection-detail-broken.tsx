import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Plus, ArrowLeftRight, Check, HelpCircle, Grid, List, Star, Sparkles, X, Info, ChevronLeft, ChevronRight, Search, Trash2, Camera, ArrowUpDown, CheckSquare, Square, Users } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import CardPhotoImport from "@/components/card-photo-import";
import CardVariantsCarousel from "@/components/card-variants-carousel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";
import scoreLigue1Logo from "@assets/image 29_1750232088999.png";
import headerBackground from "@assets/Ellipse 419_1750248420742.png";

export default function CollectionDetail() {
  const params = useParams();
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Clear cache on component mount to get fresh data
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

  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
  });

  const filteredCards = cards?.filter(card => {
    const matchesSearch = !searchTerm || 
      card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.reference.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "all": return card.cardType === "Base" && !card.cardSubType; // Only show base cards without variants
      case "owned": return card.isOwned && card.cardType === "Base" && !card.cardSubType;
      case "missing": return !card.isOwned && card.cardType === "Base" && !card.cardSubType;
      case "bases": return card.cardType === "Base" && !card.cardSubType; // Only original base cards
      case "bases_numbered": return card.cardType.includes("Parallel Laser") || card.cardType.includes("Parallel Swirl");
      case "autographs": return card.cardType === "Autograph";
      case "hits": return card.cardType.includes("Insert");
      case "special_1_1": return card.cardType === "special_1_1" || card.numbering === "1/1";
      default: return card.cardType === "Base" && !card.cardSubType;
    }
  }).sort((a, b) => {
    if (filter === "hits") {
      const getRarityOrder = (serialNumber: string | null, cardSubType: string) => {
        if (serialNumber === "1/1") return 1;
        if (cardSubType === "Holo") return 2;
        if (cardSubType === "Refractor") return 3;
        if (cardSubType === "Gold") return 4;
        if (cardSubType === "Black") return 5;
        if (cardSubType === "Red") return 6;
        if (cardSubType === "Purple") return 7;
        const total = parseInt(serialNumber?.split("/")[1] || "0");
        if (total === 15) return 8;
        if (total === 5) return 9;
        return 10;
      };
      
      const aOrder = getRarityOrder(a.serialNumber, a.cardSubType || "");
      const bOrder = getRarityOrder(b.serialNumber, b.cardSubType || "");
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // If same rarity, sort by reference
      const aNum = parseInt(a.reference.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.reference.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum;
    }
    // Sort base cards by reference
    if (filter === "bases") {
      const aNum = parseInt(a.reference.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.reference.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum; // Ascending order
    }
    return 0;
  });

  const ownedCount = cards?.filter(card => card.isOwned).length || 0;
  const totalCount = cards?.length || 0;
  const missingCount = totalCount - ownedCount;
  const basesCount = cards?.filter(card => 
    card.cardType === "Base"
  ).length || 0;
  const basesNumberedCount = cards?.filter(card => 
    card.cardType.includes("Parallel Laser") || card.cardType.includes("Parallel Swirl")
  ).length || 0;
  const autographsCount = cards?.filter(card => card.cardType === "Autograph").length || 0;
  const specialesCount = cards?.filter(card => card.cardType === "special_1_1" || card.numbering === "1/1").length || 0;
  const hitsCount = cards?.filter(card => 
    card.cardType.includes("Insert")
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

  const handleMarkAsOwned = async (cardId: number, withPhoto: boolean) => {
    try {
      await apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned: true });
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      setSelectedCard(null);
      
      if (withPhoto) {
        setShowPhotoUpload(true);
      }
      
      toast({
        title: "Carte marquée comme possédée",
        description: "Le statut de la carte a été mis à jour."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la carte.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsNotOwned = async (cardId: number) => {
    try {
      await apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned: false });
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      setSelectedCard(null);
      
      toast({
        title: "Carte marquée comme manquante",
        description: "Le statut de la carte a été mis à jour."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la carte.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoSave = async (imageUrl: string, cardId?: number) => {
    try {
      if (cardId) {
        await updateCardImageMutation.mutateAsync({ cardId, imageUrl });
        toast({
          title: "Photo ajoutée",
          description: "La photo a été ajoutée avec succès."
        });
      }
      setShowPhotoUpload(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la photo.",
        variant: "destructive"
      });
    }
  };

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
    const allCardIds = new Set(filteredCards.map(card => card.id));
    setSelectedCards(allCardIds);
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

  // Get variants for a base card
  const getCardVariants = (baseCard: Card) => {
    if (baseCard.cardType !== "Base") return [baseCard];
    
    const variants = cards?.filter(card => 
      card.reference === baseCard.reference && 
      card.playerName === baseCard.playerName && 
      card.teamName === baseCard.teamName &&
      card.cardType === "Base"
    ) || [];
    
    // Sort variants: Base first, then Laser, then Swirl
    return variants.sort((a, b) => {
      const order: Record<string, number> = { '': 0, 'Laser': 1, 'Swirl': 2 };
      return (order[a.cardSubType || ''] || 0) - (order[b.cardSubType || ''] || 0);
    });
  };

  // Check if all variants are owned
  const areAllVariantsOwned = (baseCard: Card) => {
    const variants = getCardVariants(baseCard);
    return variants.length > 0 && variants.every(variant => variant.isOwned);
  };

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setCurrentVariantIndex(0);
  };

  const getCurrentCard = () => {
    if (!selectedCard) return null;
    const variants = getCardVariants(selectedCard);
    return variants[currentVariantIndex] || selectedCard;
  };
  
  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      <main className="relative z-10 px-4 pt-4 pb-24">


        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => setShowPhotoUpload(true)}
            className="bg-[hsl(9,85%,67%)] text-white p-2 rounded-lg hover:bg-[hsl(9,85%,57%)] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 animate-pulse-glow"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Selection buttons */}
          {selectedCards.size > 0 ? (
            <button
              onClick={handleDeselectAll}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Désélectionner tout
            </button>
          ) : (
            filteredCards && filteredCards.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Tout sélectionner
              </button>
            )
          )}
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 mb-4 border-2 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">
                  {selectedCards.size} carte(s) sélectionnée(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkMarkAsOwned}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                  title="Marquer comme acquises"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleBulkMarkAsNotOwned}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  title="Marquer comme manquantes"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par joueur, équipe, référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[hsl(214,35%,22%)] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] focus:ring-1 focus:ring-[hsl(9,85%,67%)]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Cards Display */}
        {viewMode === "grid" ? (
          <div className="card-grid">
            {filteredCards?.map((card) => (
              <div 
                key={card.id} 
                className={`card-clickable rounded-lg relative transition-all cursor-pointer hover:scale-105 transform duration-300`}
              >
                {/* Checkbox for selection */}
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCardSelection(card.id, e.target.checked);
                    }}
                    className="w-5 h-5 rounded border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                  />
                </div>
                
                <div 
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.type !== 'checkbox') {
                      const cardElement = e.currentTarget.parentElement;
                      cardElement?.classList.add('clicked');
                      setTimeout(() => cardElement?.classList.remove('clicked'), 1800);
                      handleCardSelect(card);
                    }
                  }}
                  className={`card-content p-3 rounded-lg bg-[hsl(214,35%,22%)] border-2 ${
                    card.isOwned 
                      ? "border-green-400 shadow-lg shadow-green-400/30" 
                      : "border-gray-600 bg-opacity-50"
                  }`}
                >
                  {card.imageUrl ? (
                    <>
                      <img 
                        src={card.imageUrl} 
                        alt={`${card.playerName} card`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-xs mt-2 text-center">
                        <div className="font-medium text-white">
                          {card.playerName || 'Joueur Inconnu'}
                        </div>
                        <div className="text-[hsl(212,23%,69%)] text-xs">{card.teamName}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-40 bg-gray-600 rounded-lg flex items-center justify-center opacity-50">
                        <HelpCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="text-xs mt-2 text-center">
                        <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-gray-300'}`}>
                          {card.playerName || 'Joueur Inconnu'}
                        </div>
                        <div className="text-[hsl(212,23%,69%)]">{card.reference}</div>
                        <div className="text-[hsl(212,23%,69%)] text-xs">{card.teamName}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards?.map((card) => (
              <div 
                key={card.id} 
                className={`card-clickable bg-[hsl(214,35%,22%)] rounded-lg p-3 flex items-center space-x-3 border-2 transition-all cursor-pointer hover:scale-[1.02] relative ${
                  card.isOwned 
                    ? "border-green-500" 
                    : "border-gray-600"
                }`}>
                
                {/* Checkbox for selection */}
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCardSelection(card.id, e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                  />
                </div>
                
                <div 
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.type !== 'checkbox') {
                      const cardElement = e.currentTarget;
                      cardElement.classList.add('clicked');
                      setTimeout(() => cardElement.classList.remove('clicked'), 1800);
                      handleCardSelect(card);
                    }
                  }}
                  className="flex items-center space-x-3 w-full"
                >
                  <div className="w-12 h-16 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center relative ml-6">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.playerName || ""} className="w-full h-full object-cover rounded" />
                    ) : (
                      <HelpCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    {card.imageUrl ? (
                      <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-gray-300'}`}>
                        Photo de carte
                      </div>
                    ) : (
                      <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-gray-300'}`}>
                        {card.playerName || 'Joueur Inconnu'}
                      </div>
                    )}
                    <div className="text-sm text-[hsl(212,23%,69%)]">{card.reference}</div>
                    <div className="text-xs text-[hsl(212,23%,69%)]">{card.teamName}</div>
                  </div>
                  {card.isOwned && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Navigation />

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h2 className="text-lg font-bold text-white font-poppins">Détails de la carte</h2>
              <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const variants = getCardVariants(selectedCard);
                const currentCard = getCurrentCard();
                
                return (
                  <>
                    {/* Variant Navigation */}
                    {variants.length > 1 && (
                      <div className="flex items-center justify-between mb-4 bg-[hsl(216,46%,13%)] rounded-lg p-3">
                        <button
                          onClick={() => {
                            const prevVariant = currentVariantIndex > 0 ? currentVariantIndex - 1 : variants.length - 1;
                            setCurrentVariantIndex(prevVariant);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        
                        <div className="text-center">
                          <div className="text-white font-medium">
                            {currentCard?.cardSubType || "Base"} ({currentVariantIndex + 1}/{variants.length})
                          </div>
                          <div className="text-sm text-gray-400">
                            {currentCard?.cardSubType ? `Parallèle ${currentCard.cardSubType}` : "Carte de base"}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            const nextVariant = currentVariantIndex < variants.length - 1 ? currentVariantIndex + 1 : 0;
                            setCurrentVariantIndex(nextVariant);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}

                    {/* Card Image */}
                    <div className="mb-4">
                      {currentCard?.imageUrl ? (
                        <div className="relative">
                          <img 
                            src={currentCard.imageUrl} 
                            alt={`${currentCard.playerName} card`}
                            className="w-full h-64 object-cover rounded-lg cursor-pointer"
                            onClick={() => setShowFullscreenCard(true)}
                          />
                          <button
                            onClick={() => setShowFullscreenCard(true)}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-75 transition-all"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-600 rounded-lg flex items-center justify-center">
                          <HelpCircle className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-[hsl(212,23%,69%)]">Joueur:</span>
                        <span className="text-white font-medium">{selectedCard.playerName || 'Inconnu'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(212,23%,69%)]">Équipe:</span>
                        <span className="text-white">{selectedCard.teamName || 'Inconnue'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(212,23%,69%)]">Référence:</span>
                        <span className="text-white">{selectedCard.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(212,23%,69%)]">Type:</span>
                        <span className="text-white">{currentCard?.cardSubType || "Base"}</span>
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
                      {!currentCard?.isOwned ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAsOwned(currentCard?.id || 0, false)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Acquise
                          </button>
                          <button
                            onClick={() => handleMarkAsOwned(currentCard?.id || 0, true)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            + Photo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkAsNotOwned(currentCard?.id || 0)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Marquer comme manquante
                            </button>
                            <button
                              onClick={() => {
                                const cardInfo = {
                                  id: currentCard.id,
                                  playerName: selectedCard.playerName || "Joueur Inconnu",
                                  reference: selectedCard.reference,
                                  teamName: selectedCard.teamName || "Équipe Inconnue"
                                };
                                setShowPhotoUpload(true);
                              }}
                              className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              {currentCard.imageUrl ? 'Changer photo' : 'Ajouter photo'}
                            </button>
                            {currentCard.imageUrl && (
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
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
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