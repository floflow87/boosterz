import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Plus, Check, HelpCircle, Grid, List, X, Search, Trash2, Camera, CheckSquare, Square, Users, ChevronLeft, ChevronRight, Minus, Handshake } from "lucide-react";
import Navigation from "@/components/navigation";
import CardPhotoImportFixed from "@/components/card-photo-import-fixed";
import CardTradePanel from "@/components/card-trade-panel";
import LoadingScreen from "@/components/LoadingScreen";
import HaloBlur from "@/components/halo-blur";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";
import logoImage from "@assets/image 29_1750317707391.png";
import cardDefaultImage from "@assets/f455cf2a-3d9e-456f-a921-3ac0c4507202_1750348552823.png";

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
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showFullscreenCard, setShowFullscreenCard] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [cardVariantIndexes, setCardVariantIndexes] = useState<Record<string, number>>({});
  const [panStates, setPanStates] = useState<Record<string, { x: number; y: number; scale: number }>>({});
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [selectedTradeCard, setSelectedTradeCard] = useState<Card | null>(null);
  const [pulledCardEffect, setPulledCardEffect] = useState<number | null>(null);
  const [starEffectCards, setStarEffectCards] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Add scroll listener for background effect and sticky actions bar
  useEffect(() => {
    const handleScroll = () => {
      const categoryTabs = document.getElementById('category-tabs');
      const stickyActions = document.getElementById('sticky-actions');
      if (categoryTabs) {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
          categoryTabs.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
          categoryTabs.style.backdropFilter = 'blur(10px)';
        } else {
          categoryTabs.style.backgroundColor = 'transparent';
          categoryTabs.style.backdropFilter = 'none';
        }
      }
      
      // Show sticky actions bar when cards are selected and user scrolls
      if (stickyActions && selectedCards.size > 0) {
        stickyActions.style.display = 'flex';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCards.size]);

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
    onSuccess: (_, { cardId, isOwned }) => {
      if (isOwned) {
        // Déclencher l'effet de tirage (sans tremblement)
        setPulledCardEffect(cardId);
        setTimeout(() => setPulledCardEffect(null), 2000);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
    }
  });

  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
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
    
    let sortedCards = Array.from(playerGroups.values());
    
    // Pour les hits, trier par type de carte puis par joueur
    if (filter === "hits") {
      sortedCards.sort((a, b) => {
        // D'abord par type de carte
        if (a.cardType !== b.cardType) {
          return a.cardType.localeCompare(b.cardType);
        }
        // Puis par nom de joueur
        return (a.playerName || "").localeCompare(b.playerName || "");
      });
    } else {
      // Pour les autres filtres, trier par numéro de référence
      sortedCards.sort((a, b) => {
        const getCardNumber = (ref: string) => {
          // Pour les références simples comme "001", "002", etc.
          if (/^\d+$/.test(ref)) {
            return parseInt(ref, 10);
          }
          // Pour les références avec suffixe comme "001-L", "001-S", etc.
          const match = ref.match(/^(\d+)/);
          return match ? parseInt(match[1], 10) : 999;
        };
        
        const aNum = getCardNumber(a.reference);
        const bNum = getCardNumber(b.reference);
        
        // Si les numéros de base sont identiques, trier par référence complète
        if (aNum === bNum) {
          return a.reference.localeCompare(b.reference);
        }
        
        return aNum - bNum;
      });
    }
    
    return sortedCards;
  };

  const filteredCards = getUniquePlayerCards();

  // Calculate numbered bases count (excluding 1/1 cards)
  const numberedBasesCount = cards?.filter(card => 
    card.cardType === "Parallel Numbered" && 
    card.numbering !== "1/1"
  ).length || 0;

  if (collectionLoading || cardsLoading) {
    return <LoadingScreen />;
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
    
    // Find the card being selected/deselected
    const targetCard = cards?.find(c => c.id === cardId);
    if (!targetCard) return;
    
    // Get all variants for this player
    const variants = getCardVariants(targetCard);
    
    if (checked) {
      // Add ALL variants for this player
      variants.forEach(variant => {
        newSelection.add(variant.id);
      });
    } else {
      // Remove ALL variants for this player
      variants.forEach(variant => {
        newSelection.delete(variant.id);
      });
    }
    
    setSelectedCards(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const handleSelectAll = () => {
    if (!filteredCards) return;
    // Select ALL variants for each player, not just the visible one
    const allVariantIds = new Set<number>();
    
    filteredCards.forEach(card => {
      const variants = getCardVariants(card);
      variants.forEach(variant => {
        allVariantIds.add(variant.id);
      });
    });
    
    setSelectedCards(allVariantIds);
    setShowBulkActions(true);
  };

  const handleDeselectAll = () => {
    setSelectedCards(new Set());
    setShowBulkActions(false);
  };

  const handleBulkMarkAsOwned = async () => {
    try {
      // Déclencher l'effet d'étoiles pour toutes les cartes sélectionnées non possédées
      const cardsToMark = Array.from(selectedCards).filter(cardId => {
        const card = cards?.find(c => c.id === cardId);
        return card && !card.isOwned;
      });
      
      // Ajouter l'effet d'étoiles pour toutes les cartes à marquer
      cardsToMark.forEach(cardId => {
        setStarEffectCards(prev => {
          const newSet = new Set(prev);
          newSet.add(cardId);
          return newSet;
        });
      });
      
      // Mettre à jour immédiatement le cache pour un rendu instantané
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          cardsToMark.includes(card.id) ? { ...card, isOwned: true } : card
        );
      });
      
      const promises = cardsToMark.map(async (cardId) => {
        return apiRequest("PATCH", `/api/cards/${cardId}/toggle`);
      });
      await Promise.all(promises);
      
      // Retirer l'effet d'étoiles après l'animation
      setTimeout(() => {
        cardsToMark.forEach(cardId => {
          setStarEffectCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
        });
      }, 2000);
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/1/collections'] });
      setSelectedCards(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "Cartes marquées comme acquises",
        description: `${cardsToMark.length} carte(s) marquée(s) comme acquise(s).`,
        className: "bg-green-900 border-green-700 text-green-100"
      });
    } catch (error) {
      console.error("Bulk mark as owned error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les cartes.",
        variant: "destructive"
      });
    }
  };

  const handleBulkMarkAsNotOwned = async () => {
    try {
      const cardsToUnmark = Array.from(selectedCards).filter(cardId => {
        const card = cards?.find(c => c.id === cardId);
        return card && card.isOwned;
      });
      
      // Mettre à jour immédiatement le cache pour un rendu instantané
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          cardsToUnmark.includes(card.id) ? { ...card, isOwned: false } : card
        );
      });
      
      const promises = cardsToUnmark.map(async (cardId) => {
        return apiRequest("PATCH", `/api/cards/${cardId}/toggle`);
      });
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/1/collections'] });
      setSelectedCards(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "Cartes marquées comme manquantes",
        description: `${cardsToUnmark.length} carte(s) marquée(s) comme manquante(s).`,
        className: "bg-[hsl(9,85%,67%)] border-[hsl(9,85%,57%)] text-white"
      });
    } catch (error) {
      console.error("Bulk mark as not owned error:", error);
      // Revert cache on error
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
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
      // Déclencher l'effet d'étoiles une seule fois
      setStarEffectCards(prev => {
        const newSet = new Set(prev);
        newSet.add(cardId);
        return newSet;
      });
      
      // Update local state immediately for visual feedback
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: true });
      }
      
      // Mettre à jour immédiatement le cache pour un rendu instantané
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          card.id === cardId ? { ...card, isOwned: true } : card
        );
      });
      
      await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: true });
      
      // Retirer l'effet d'étoiles après l'animation
      setTimeout(() => {
        setStarEffectCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      }, 2000);
      
      if (withPhoto) {
        setShowPhotoUpload(true);
      }
      toast({
        title: "Carte marquée comme acquise",
        description: "La carte a été marquée comme acquise avec succès.",
        className: "bg-green-900 border-green-700 text-green-100"
      });
    } catch (error) {
      // Revert local state on error
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: false });
      }
      // Revert cache on error
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          card.id === cardId ? { ...card, isOwned: false } : card
        );
      });
      // Retirer l'effet d'étoiles en cas d'erreur
      setStarEffectCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
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
      
      // Mettre à jour immédiatement le cache pour un rendu instantané
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          card.id === cardId ? { ...card, isOwned: false } : card
        );
      });
      
      await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: false });
      toast({
        title: "Carte marquée comme manquante",
        description: "La carte a été marquée comme manquante avec succès.",
        className: "bg-[hsl(9,85%,67%)] border-[hsl(9,85%,57%)] text-white"
      });
    } catch (error) {
      // Revert local state on error
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, isOwned: true });
      }
      // Revert cache on error
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          card.id === cardId ? { ...card, isOwned: true } : card
        );
      });
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme manquante.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoSave = async (imageUrl: string, cardId?: number) => {
    if (cardId) {
      try {
        // Update local state immediately for visual feedback
        if (selectedCard && selectedCard.id === cardId) {
          setSelectedCard({ ...selectedCard, imageUrl, isOwned: true });
        }
        
        // Update card image
        await updateCardImageMutation.mutateAsync({ cardId, imageUrl });
        
        // Automatically mark card as owned
        await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: true });
        
        toast({
          title: "Photo ajoutée",
          description: "La photo a été ajoutée et la carte marquée comme acquise."
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter la photo.",
          variant: "destructive"
        });
      }
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
    
    // Violet brillant pour les hits (Insert)
    if (card.cardType?.includes("Insert")) {
      return "border-purple-500 shadow-lg shadow-purple-500/50";
    }
    
    // Gold brillant pour les autographes
    if (card.cardType === "Autograph") {
      return "border-yellow-500 shadow-lg shadow-yellow-500/50";
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

  if (collectionLoading || cardsLoading) {
    return <LoadingScreen message="Chargement de la collection..." />;
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white overflow-x-hidden relative">
      <HaloBlur />
      
      {/* Sticky Actions Bar */}
      {selectedCards.size > 0 && (
        <div 
          id="sticky-actions"
          className="fixed top-0 left-0 right-0 z-[100] bg-gray-900/95 backdrop-blur-md border-b border-gray-700 px-4 py-3 shadow-lg"
        >
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">
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
        </div>
      )}
      
      <main className={`px-3 pb-20 relative z-10 transition-all duration-300 ${selectedCards.size > 0 ? 'pt-20' : 'pt-3'}`} id="collection-top">
        {/* Collection Header */}
        <div className="flex items-start mb-6">
          <button
            onClick={() => setLocation('/collections')}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-xl font-bold text-white text-center mb-1">
              {collection?.name || "Collection"}
            </h1>
            <p className="text-gray-400 text-sm italic text-center">2023/24</p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Category Tabs - Badge Style - Sticky */}
        <div className="sticky top-0 z-50 pb-4 mb-2 pt-2 -mx-3 px-3 transition-all duration-300" id="category-tabs">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide min-h-[52px] items-center pl-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
            onClick={() => setFilter("bases")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
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
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
              filter === "bases_numbered" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Bases numérotées ({numberedBasesCount})
          </button>
          <button
            onClick={() => setFilter("hits")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
              filter === "hits" 
                ? "bg-purple-600 text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Hits
          </button>
          <button
            onClick={() => setFilter("autographs")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
              filter === "autographs" 
                ? "bg-yellow-600 text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Autographes
          </button>
          <button
            onClick={() => setFilter("special_1_1")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
              filter === "special_1_1" 
                ? "bg-black text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Spéciales
          </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-2 mt-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par joueur ou équipe"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                
                if (value.length >= 2) {
                  const uniquePlayers = Array.from(new Set(cards?.map(card => card.playerName).filter(Boolean))) as string[];
                  const uniqueTeams = Array.from(new Set(cards?.map(card => card.teamName).filter(Boolean))) as string[];
                  const allSuggestions = [...uniquePlayers, ...uniqueTeams];
                  
                  const filtered = allSuggestions.filter(item => 
                    item.toLowerCase().includes(value.toLowerCase())
                  ).slice(0, 5);
                  
                  setSearchSuggestions(filtered);
                  setShowSearchSuggestions(filtered.length > 0);
                } else {
                  setShowSearchSuggestions(false);
                  setSearchSuggestions([]);
                }
              }}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSearchSuggestions(true);
                }
              }}
              className="w-full pl-10 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 placeholder:text-sm focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setShowSearchSuggestions(false);
                  setSearchSuggestions([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                    onClick={() => {
                      setSearchTerm(suggestion);
                      setShowSearchSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
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

        {/* Selection Controls - Only show "Select All" when no cards selected */}
        {selectedCards.size === 0 && filteredCards && filteredCards.length > 0 && (
          <div className="mb-4">
            <button
              onClick={handleSelectAll}
              className="text-sm hover:opacity-80"
              style={{ color: '#F37261' }}
            >
              Tout sélectionner
            </button>
          </div>
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
            
            // Check if ANY variant for this player is selected
            const isAnyVariantSelected = variants.some(variant => selectedCards.has(variant.id));
            
            return (
              <div 
                key={playerKey}
                className={`relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-200 ${
                  isAnyVariantSelected 
                    ? `border-4 ${getCardBorderColor(currentVariant)} shadow-lg ring-2 ring-opacity-50 ${
                        getCardBorderColor(currentVariant).includes('border-green-500') ? 'ring-green-400' :
                        getCardBorderColor(currentVariant).includes('border-blue-500') ? 'ring-blue-400' :
                        getCardBorderColor(currentVariant).includes('border-purple-500') ? 'ring-purple-400' :
                        getCardBorderColor(currentVariant).includes('border-yellow-500') ? 'ring-yellow-400' :
                        'ring-gray-400'
                      }`
                    : `border-2 ${getCardBorderColor(currentVariant)}`
                }`}
              >
                {/* Étoiles gravitantes pour l'effet d'acquisition */}
                {starEffectCards.has(currentVariant.id) && (
                  <div className="card-stars"></div>
                )}
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={isAnyVariantSelected}
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
                  className="cursor-pointer hover:bg-gray-700 transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 relative border border-blue-400">
                    {currentVariant.imageUrl ? (
                      <img 
                        src={currentVariant.imageUrl} 
                        alt={currentVariant.playerName || ""} 
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        onError={(e) => {
                          console.log("Image failed to load:", currentVariant.imageUrl);
                          // Fallback to default image if image fails to load
                          e.currentTarget.src = cardDefaultImage;
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", currentVariant.imageUrl);
                        }}

                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                        {/* Score Ligue 1 Logo */}
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 opacity-80">
                          <img 
                            src={logoImage} 
                            alt="Score Ligue 1" 
                            className="w-12 h-12 object-contain"
                          />
                        </div>

                        
                      </div>
                    )}
                    
                    
                  </div>
                  
                  {/* Card Info */}
                  <div className="p-3">
                    {currentVariant.cardType?.includes("Insert") && (
                      <div className="text-purple-400 text-xs font-medium mb-1">
                        {(() => {
                          const cardType = currentVariant.cardType || "";
                          if (cardType.includes("Hot Rookies")) return "Hot Rookies";
                          if (cardType.includes("Keepers")) return "Keepers";
                          if (cardType.includes("Club Legend")) return "Club Legend";
                          if (cardType.includes("Spotlight")) return "Spotlight";
                          if (cardType.includes("Pennants")) return "Pennants";
                          if (cardType.includes("Next Up")) return "Next Up";
                          if (cardType.includes("Intergalactic")) return "Intergalactic";
                          if (cardType.includes("Score Team")) return "Score Team";
                          if (cardType.includes("Breakthrough")) return "Breakthrough";
                          if (cardType.includes("Pure Class")) return "Pure Class";
                          return "Insert";
                        })()}
                      </div>
                    )}
                    <div className="text-white font-bold text-sm mb-1">
                      {currentVariant.playerName}
                    </div>
                    <div className="text-gray-400 text-xs mb-1">
                      {currentVariant.teamName}
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

      {/* Card Detail Modal - Fullscreen with slide animation */}
      {selectedCard && (
        <div 
          className="fixed inset-0 bg-black z-50"
          style={{
            animation: 'slideInFromRight 0.4s ease-out'
          }}
        >
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-[hsl(214,35%,22%)] border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                {selectedCard.playerName || 'Joueur Inconnu'}
              </h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content - Single screen view */}
            <div className="flex-1 bg-[hsl(216,46%,13%)] flex flex-col md:flex-row">
              {/* Card Image Section */}
              <div className="flex-1 flex items-center justify-center p-6">
                {(() => {
                  const currentCard = getCurrentCard();
                  const variants = getCardVariants(selectedCard);
                  
                  return (
                    <div className="w-full max-w-md">
                      {/* Card Image */}
                      <div className="relative mb-6">
                        {currentCard?.imageUrl ? (
                          <div 
                            className="relative w-full h-80 perspective-1000"
                            style={{ perspective: '1000px' }}
                          >
                            <img 
                              src={currentCard.imageUrl} 
                              alt={`${currentCard.playerName} card`}
                              className={`w-full h-full object-cover rounded-lg transition-transform duration-500 ${starEffectCards.has(currentCard.id) ? 'animate-sparkle-stars' : ''}`}
                              style={{
                                transformStyle: 'preserve-3d',
                                willChange: 'transform',
                                animation: 'card-auto-float 6s ease-in-out infinite'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-80 bg-gray-600 rounded-lg flex items-center justify-center">
                            <HelpCircle className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Card Info Section */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedCard.playerName || 'Joueur Inconnu'}
                  </h3>
                  <p className="text-gray-400 text-lg">
                    {selectedCard.teamName || 'Équipe Inconnue'}
                  </p>
                </div>

                {/* Card Details */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{selectedCard.cardType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Numérotation:</span>
                    <span className="text-white">{selectedCard.numbering || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Statut:</span>
                    <span className={selectedCard.isOwned ? "text-green-400" : "text-red-400"}>
                      {selectedCard.isOwned ? "Possédée" : "Manquante"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => {
                      setShowPhotoUpload(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Ajouter une photo
                  </button>
                  
                  {selectedCard.isOwned && (
                    <button
                      onClick={() => {
                        setSelectedTradeCard(selectedCard);
                        setShowTradePanel(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Handshake className="w-5 h-5" />
                      Proposer un échange
                    </button>
                  )}
                </div>
              </div>
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
                  style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                    animation: 'card-auto-float 6s ease-in-out infinite'
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
      <CardPhotoImportFixed
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        preselectedPlayer={selectedCard?.playerName || undefined}
        onImageUploaded={async (cardId, imageUrl) => {
          try {
            console.log("Starting image upload process for card:", cardId, "with image:", imageUrl.substring(0, 50) + "...");
            
            // Update card image first
            const imageResult = await updateCardImageMutation.mutateAsync({ cardId, imageUrl });
            console.log("Image update result:", imageResult);
            
            // Automatically mark card as owned
            const ownershipResult = await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: true });
            console.log("Ownership update result:", ownershipResult);
            
            // Force refresh of cards data to ensure images are displayed
            await queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
            console.log("Query cache invalidated for cards");
            
            // Update local state after successful API calls
            if (selectedCard && selectedCard.id === cardId) {
              const updatedCard = { ...selectedCard, imageUrl, isOwned: true };
              setSelectedCard(updatedCard);
              console.log("Local selected card state updated:", updatedCard);
            }
            
            // Trigger card pull effect
            setPulledCardEffect(cardId);
            setTimeout(() => setPulledCardEffect(null), 3000);
            
            toast({
              title: "Photo sauvegardée",
              description: "La photo a été ajoutée et la carte marquée comme acquise.",
              className: "bg-green-900 border-green-700 text-green-100",
            });
            
            setShowPhotoUpload(false);
          } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            toast({
              title: "Erreur",
              description: "Impossible de sauvegarder la photo. Vérifiez votre connexion.",
              variant: "destructive"
            });
          }
        }}
        availableCards={cards || []}
        initialCard={selectedCard || undefined}
        currentFilter={filter}
      />

      {/* Trade Panel Modal */}
      {selectedTradeCard && (
        <CardTradePanel
          card={selectedTradeCard}
          isOpen={showTradePanel}
          onClose={() => {
            setShowTradePanel(false);
            setSelectedTradeCard(null);
          }}
        />
      )}
    </div>
  );
}
                            return "Insert";
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[hsl(212,23%,69%)] text-xs">Numérotation:</span>
                      <span className="text-white text-xs">{currentCard?.numbering || 'Non numérotée'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(212,23%,69%)] text-xs">Statut:</span>
                      <span className={`font-bold text-xs ${currentCard?.isOwned ? 'text-green-400' : 'text-red-400'}`}>
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
                        className="flex-1 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                        style={{ backgroundColor: '#F37261' }}
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
                  style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                    animation: 'card-auto-float 6s ease-in-out infinite'
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
      <CardPhotoImportFixed
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        preselectedPlayer={selectedCard?.playerName || undefined}
        onImageUploaded={async (cardId, imageUrl) => {
          try {
            console.log("Starting image upload process for card:", cardId, "with image:", imageUrl.substring(0, 50) + "...");
            
            // Update card image first
            const imageResult = await updateCardImageMutation.mutateAsync({ cardId, imageUrl });
            console.log("Image update result:", imageResult);
            
            // Automatically mark card as owned
            const ownershipResult = await toggleOwnershipMutation.mutateAsync({ cardId, isOwned: true });
            console.log("Ownership update result:", ownershipResult);
            
            // Force refresh of cards data to ensure images are displayed
            await queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
            console.log("Query cache invalidated for cards");
            
            // Update local state after successful API calls
            if (selectedCard && selectedCard.id === cardId) {
              const updatedCard = { ...selectedCard, imageUrl, isOwned: true };
              setSelectedCard(updatedCard);
              console.log("Local selected card state updated:", updatedCard);
            }
            
            // Trigger card pull effect
            setPulledCardEffect(cardId);
            setTimeout(() => setPulledCardEffect(null), 3000);
            
            toast({
              title: "Photo sauvegardée",
              description: "La photo a été ajoutée et la carte marquée comme acquise.",
              className: "bg-green-900 border-green-700 text-green-100",
            });
            
            setShowPhotoUpload(false);
          } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            toast({
              title: "Erreur",
              description: "Impossible de sauvegarder la photo. Vérifiez votre connexion.",
              variant: "destructive"
            });
          }
        }}
        availableCards={cards || []}
        initialCard={selectedCard || undefined}
        currentFilter={filter}
      />

      {/* Trade Panel Modal */}
      {selectedTradeCard && (
        <CardTradePanel
          card={selectedTradeCard}
          isOpen={showTradePanel}
          onClose={() => {
            setShowTradePanel(false);
            setSelectedTradeCard(null);
          }}
        />
      )}
    </div>
  );
}