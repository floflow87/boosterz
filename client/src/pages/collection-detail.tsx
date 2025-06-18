import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Plus, Check, HelpCircle, Grid, List, X, Search, Trash2, Camera, CheckSquare, Square, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/navigation";
import CardPhotoImport from "@/components/card-photo-import";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";

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

  const filteredCards = cards?.filter(card => {
    const matchesSearch = !searchTerm || 
      card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.reference.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "all": return card.cardType === "Base" && !card.cardSubType;
      case "owned": return card.isOwned && card.cardType === "Base" && !card.cardSubType;
      case "missing": return !card.isOwned && card.cardType === "Base" && !card.cardSubType;
      case "bases": return card.cardType === "Base" && !card.cardSubType;
      case "bases_numbered": return card.cardType.includes("Parallel Laser") || card.cardType.includes("Parallel Swirl");
      case "autographs": return card.cardType === "Autograph";
      case "hits": return card.cardType.includes("Insert");
      case "special_1_1": return card.cardType === "special_1_1" || card.numbering === "1/1";
      default: return card.cardType === "Base" && !card.cardSubType;
    }
  });

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

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setCurrentVariantIndex(0);
  };

  const handleMarkAsOwned = async (cardId: number, withPhoto: boolean) => {
    try {
      await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: true });
      if (withPhoto) {
        setShowPhotoUpload(true);
      }
      toast({
        title: "Carte marquée comme acquise",
        description: "La carte a été marquée comme acquise avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme acquise.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsNotOwned = async (cardId: number) => {
    try {
      await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: false });
      toast({
        title: "Carte marquée comme manquante",
        description: "La carte a été marquée comme manquante avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme manquante.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoSave = (imageUrl: string, cardId?: number) => {
    if (cardId) {
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
    
    // Pour les autres cartes, on garde toutes les variantes
    return cards.filter(c => 
      c.playerName === card.playerName && 
      c.teamName === card.teamName &&
      c.collectionId === card.collectionId
    );
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

  const getCurrentCard = () => {
    if (!selectedCard) return null;
    const variants = getCardVariants(selectedCard);
    return variants[currentVariantIndex] || selectedCard;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-3 pt-3 pb-20">
        {/* Category Tabs */}
        <div className="flex items-center mb-4 border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setFilter("bases")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              filter === "bases" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
            }`}
          >
            Bases
          </button>
          <button
            onClick={() => setFilter("bases_numbered")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              filter === "bases_numbered" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
            }`}
          >
            Bases numérotées
          </button>
          <button
            onClick={() => setFilter("hits")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              filter === "hits" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
            }`}
          >
            Hits
          </button>
          <button
            onClick={() => setFilter("autographs")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              filter === "autographs" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
            }`}
          >
            Autographes
          </button>
          <button
            onClick={() => setFilter("special_1_1")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              filter === "special_1_1" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
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
              placeholder="Filtrer par joueur ou équipe"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Bookmark icon */}
          <button className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="w-4 h-4 border border-gray-400"></div>
          </button>
          
          {/* Info icon */}
          <button className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
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
          {filteredCards?.map((card) => (
            <div 
              key={card.id} 
              className={`relative bg-gray-800 rounded-xl overflow-hidden border-2 ${getCardBorderColor(card)}`}
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-20">
                <input
                  type="checkbox"
                  checked={selectedCards.has(card.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCardSelection(card.id, e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500"
                />
              </div>
              
              {/* Card Number Badge */}
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                {card.reference}
              </div>
              
              {/* Ownership Status */}
              {card.isOwned && (
                <div className="absolute top-8 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  Acquise
                </div>
              )}
              
              {/* Card Content */}
              <div 
                onClick={() => handleCardSelect(card)}
                className="cursor-pointer hover:bg-gray-700 transition-colors"
              >
                {/* Card Image */}
                <div className="aspect-[3/4] bg-gray-600 relative">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.playerName || ""} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HelpCircle className="w-12 h-12 text-gray-400 opacity-50" />
                    </div>
                  )}
                  
                  {/* Player Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div className="text-white font-bold text-sm">
                      {card.playerName?.toUpperCase() || 'JOUEUR INCONNU'}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {card.teamName}
                    </div>
                  </div>
                </div>
                
                {/* Card Info */}
                <div className="p-3">
                  <div className="text-gray-400 text-xs mt-1">
                    {card.rarity || 'Base'}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {(() => {
                      const variants = getCardVariants(card);
                      return `${variants.length} variante${variants.length > 1 ? 's' : ''}`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                  <h2 className="text-xl font-bold text-white mb-4">
                    Détails de la carte
                  </h2>

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
                    {!currentCard?.isOwned ? (
                      <div className="space-y-2">
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
                            className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Photo
                          </button>
                        </div>
                        <button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Proposer un trade
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
                            Manquante
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
                            Photo
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
                        <button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Proposer un trade
                        </button>
                      </div>
                    )}
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