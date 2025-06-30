import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Plus, Check, HelpCircle, Grid, List, X, Search, Trash2, Camera, CheckSquare, Square, Users, ChevronLeft, ChevronRight, Minus, Handshake, MoreVertical, Star } from "lucide-react";
import Navigation from "@/components/navigation";
import CardPhotoImportFixed from "@/components/card-photo-import-fixed";
import CardTradePanel from "@/components/card-trade-panel";
import LoadingScreen from "@/components/LoadingScreen";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
// import { ProductionDiagnostic } from "@/components/production-diagnostic";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";
import { determineRarity, getRarityInfo, type RarityLevel } from "@shared/rarity";
import logoImage from "@assets/image 29_1750317707391.png";
import cardDefaultImage from "@assets/f455cf2a-3d9e-456f-a921-3ac0c4507202_1750348552823.png";

export default function CollectionDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "bases" | "autographs" | "hits" | "special_1_1">("bases");
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
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
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

  const updateCardFeaturedMutation = useMutation({
    mutationFn: async ({ cardId, isFeatured }: { cardId: number; isFeatured: boolean }) => {
      return apiRequest("PATCH", `/api/cards/${cardId}/featured`, { isFeatured });
    },
    onSuccess: (updatedCard, { cardId, isFeatured }) => {
      // Mise à jour optimiste du cache sans invalider (pour éviter le réordonnancement)
      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(card => 
          card.id === cardId ? { ...card, isFeatured } : card
        );
      });
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

  const { data: cardsResponse, isLoading: cardsLoading, error: cardsError } = useQuery<{cards: Card[], pagination?: any}>({
    queryKey: [`/api/collections/${collectionId}/cards`],
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  // Extract cards from response (handle both old array format and new paginated format)
  const cards = cardsResponse?.cards || (Array.isArray(cardsResponse) ? cardsResponse : []);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [collectionId]);

  // Group cards by player and show only one card per player
  // Fonction pour obtenir toutes les variantes d'un joueur pour les autographes
  const getPlayerVariants = (playerName: string, teamName: string) => {
    if (!cards) return [];
    return cards.filter(card => 
      card.playerName === playerName && 
      card.teamName === teamName && 
      card.cardType.includes("Autograph") &&
      card.numbering !== "/1" // Exclude 1/1 cards
    ).sort((a, b) => {
      // Trier par ordre de rareté : numérotées par ordre décroissant
      const aNum = parseInt(a.numbering?.replace("/", "") || "0");
      const bNum = parseInt(b.numbering?.replace("/", "") || "0");
      return bNum - aNum; // Ordre décroissant pour les numérotées
    });
  };

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
          // "Bases num." = Parallel Numbered (les 9 variantes par joueur)
          includeCard = card.cardType === "Parallel Numbered";
          break;

        case "autographs": 
          // Autographes (toutes les variantes)
          includeCard = card.cardType.includes("Autograph");
          break;
        case "hits": 
          // Toutes les cartes Insert
          includeCard = card.cardType.includes("Insert");
          break;
        case "special_1_1": 
          // Cartes spéciales 1/1 : bases + inserts (sauf Intergalactic, Pennants, Next Up) + tous autographes
          includeCard = card.cardType === "Base" || 
                       card.cardType.includes("Autograph") ||
                       (card.cardType.includes("Insert") && 
                        !card.cardType.includes("Intergalactic") && 
                        !card.cardType.includes("Pennants") && 
                        !card.cardType.includes("Next Up"));
          break;

        default: 
          // Par défaut, afficher les bases numérotées
          includeCard = card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl";
      }

      if (includeCard) {
        const playerKey = `${card.playerName}-${card.teamName}`;
        if (!playerGroups.has(playerKey)) {
          // Pour les autographes, on stocke la première carte mais on va gérer les variantes
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

  // Debug logging pour la production
  useEffect(() => {
    console.log("Collection loading state:", { 
      collectionLoading, 
      cardsLoading, 
      cardsError
    });
    console.log("Cards data:", cards ? `${cards.length} cards loaded` : "No cards data");
    if (cardsError) {
      console.error("Cards loading error:", cardsError);
    }
  }, [collectionLoading, cardsLoading, cards, cardsError]);

  if (collectionLoading) {
    return <LoadingScreen />;
  }

  if (cardsLoading) {
    return <LoadingScreen message="Chargement des cartes..." />;
  }

  if (cardsError) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl mb-4">Erreur de chargement</h2>
          <p className="text-gray-400 mb-4">Impossible de charger les cartes de la collection</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] })}
            className="text-white px-4 py-2 rounded transition-all duration-300"
            style={{ backgroundColor: '#F37261' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#E85A47'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#F37261'}
          >
            Réessayer
          </button>
        </div>
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
    
    // Pour les cartes Base : pas de variantes
    if (card.cardType === "Base") {
      return [card];
    }
    
    // Pour les bases numérotées : créer les 9 variantes spécifiques
    if (card.cardType === "Parallel Numbered") {
      const numberedVariants = [
        { ...card, id: card.id + 1000, numbering: "1/50", cardSubType: "Laser" },
        { ...card, id: card.id + 2000, numbering: "1/35", cardSubType: "Laser" },
        { ...card, id: card.id + 3000, numbering: "1/30", cardSubType: "Swirl" },
        { ...card, id: card.id + 4000, numbering: "1/25", cardSubType: "Swirl" },
        { ...card, id: card.id + 5000, numbering: "1/20", cardSubType: "Swirl" },
        { ...card, id: card.id + 6000, numbering: "1/15", cardSubType: "Swirl" },
        { ...card, id: card.id + 7000, numbering: "1/15", cardSubType: "Laser" },
        { ...card, id: card.id + 8000, numbering: "1/10", cardSubType: "Swirl" },
        { ...card, id: card.id + 9000, numbering: "1/5", cardSubType: "Laser" }
      ];
      
      return numberedVariants;
    }
    
    // Pour les inserts : gérer les cas spéciaux et variantes
    if (card.cardType?.includes("Insert")) {
      // Cas spéciaux : Intergalactic, Next Up, Pennants = 1 seule carte
      if (card.cardType.includes("Intergalactic") || 
          card.cardType.includes("Next Up") || 
          card.cardType.includes("Pennant")) {
        return [card];
      }
      
      // Pour les autres hits : 2 variantes seulement (/15 et /10)
      const hitVariants = [];
      
      // Variante de base avec /15
      hitVariants.push({ ...card, id: card.id, numbering: "/15" });
      
      // Variante numérotée avec /10
      hitVariants.push({ ...card, id: card.id + 1000, numbering: "/10" });
      
      return hitVariants;
    }
    
    // Pour les autographes : pas de variantes (1 seule version)
    if (card.cardType?.includes("Autograph")) {
      return [card];
    }
    
    // Pour les autres cartes, retourner la carte elle-même
    return [card];
  };

  const getCardBorderColor = (card: Card) => {
    if (!card.isOwned) return "border-gray-600";
    
    // Vert pour les bases
    if (card.cardType === "Base") {
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
    
    // Gold brillant pour tous les autographes
    if (card.cardType.includes("Autograph")) {
      return "border-yellow-500 shadow-lg shadow-yellow-500/50";
    }
    
    // Noir pour les spéciales 1/1
    if (card.cardType === "Base" || 
        card.cardType.includes("Autograph") ||
        (card.cardType.includes("Insert") && 
         !card.cardType.includes("Intergalactic") && 
         !card.cardType.includes("Pennants") && 
         !card.cardType.includes("Next Up"))) {
      return "border-black";
    }
    
    return "border-green-500"; // Default
  };

  const getCardAnimationName = (card: Card) => {
    if (!card.isOwned) return null;
    
    // Vert pour les bases
    if (card.cardType === "Base") {
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
    
    // Gold pour tous les autographes
    if (card.cardType.includes("Autograph")) {
      return "pulse-shadow-yellow";
    }
    
    // Noir pour les spéciales 1/1
    if (card.cardType === "Base" || 
        card.cardType.includes("Autograph") ||
        (card.cardType.includes("Insert") && 
         !card.cardType.includes("Intergalactic") && 
         !card.cardType.includes("Pennants") && 
         !card.cardType.includes("Next Up"))) {
      return "pulse-shadow-black";
    }
    
    return "pulse-shadow-green"; // Default green
  };

  const getFormattedCardType = (card: Card) => {
    // Pour les cartes Base selon le sous-type
    if (card.cardType === "Base") {
      if (card.cardSubType === "Swirl") return "Base swirl";
      if (card.cardSubType === "Laser") return "Base laser";
      return "Base";
    }
    
    // Pour les bases numérotées
    if (card.cardType === "Parallel Numbered") {
      const numbering = card.numbering ? card.numbering.replace("1", "") : "/X";
      const subType = card.cardSubType ? ` ${card.cardSubType.toLowerCase()}` : "";
      return `Base ${numbering}${subType}`;
    }
    
    // Pour les inserts
    if (card.cardType?.includes("Insert")) {
      const insertType = card.cardType.replace("Insert ", "").toLowerCase();
      return `Insert ${insertType}`;
    }
    
    // Pour les autographes
    if (card.cardType?.includes("Autograph")) {
      return `Autographe ${card.numbering || "/X"}`;
    }
    
    // Défaut
    return card.cardType || "Type inconnu";
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
              Bases num.
            </button>

          <button
            onClick={() => setFilter("hits")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
              filter === "hits" 
                ? "text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            style={filter === "hits" ? { backgroundColor: '#F37261' } : {}}
          >
            Hits
          </button>
          <button
            onClick={() => setFilter("autographs")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
              filter === "autographs" 
                ? "text-white shadow-lg transform scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            style={filter === "autographs" ? { backgroundColor: '#F37261' } : {}}
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

        {/* Search Bar and View Toggle */}
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
          

          

        </div>

        {/* View Toggle and Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* View Toggle Buttons */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid" 
                    ? "bg-[hsl(9,85%,67%)] text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "list" 
                    ? "bg-[hsl(9,85%,67%)] text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Select All - Only show when no cards selected */}
            {selectedCards.size === 0 && filteredCards && filteredCards.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm hover:opacity-80"
                style={{ color: '#F37261' }}
              >
                Tout sélectionner
              </button>
            )}
          </div>
        </div>



        {/* Cards Display */}
        {!filteredCards || filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4 text-lg">
              {searchTerm ? "Aucune carte trouvée pour cette recherche" : 
               "Aucune carte dans cette catégorie"}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-white px-4 py-2 rounded transition-all duration-300"
              style={{ backgroundColor: '#F37261' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#E85A47'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#F37261'}
            >
              Recharger la page
            </button>
          </div>
        ) : viewMode === "grid" ? (
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

                {/* Featured Star */}
                {currentVariant.isFeatured && (
                  <div className="absolute top-2 right-2 z-20">
                    <div className="bg-yellow-500 rounded-full p-1">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  </div>
                )}
                
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
                   currentVariant.cardType === "Autograph" ? "Auto" :
                   currentVariant.cardType === "Autograph 1/1" ? "Auto 1/1" :
                   currentVariant.cardType === "Autograph Gold" ? "Auto Gold" :
                   currentVariant.cardType === "Autograph Red" ? "Auto Red" :
                   currentVariant.cardType === "Autograph Silver" ? "Auto Silver" :
                   currentVariant.cardType === "Autograph Blue" ? "Auto Blue" :
                   currentVariant.cardType === "Autograph Green" ? "Auto Green" :
                   currentVariant.cardType === "Autograph Bronze" ? "Auto Bronze" :
                   currentVariant.cardType.includes("Autograph") ? "Auto" :
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
                      {getFormattedCardType(currentVariant)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredCards?.map((card) => {
              const variants = getCardVariants(card);
              const playerKey = `${card.playerName}-${card.teamName}`;
              const currentVariantIdx = cardVariantIndexes[playerKey] || 0;
              const currentVariant = variants[currentVariantIdx] || card;
              const isAnyVariantSelected = variants.some(variant => selectedCards.has(variant.id));

              return (
                <div 
                  key={playerKey}
                  className={`bg-gray-800 rounded-lg p-3 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:bg-gray-700 ${
                    isAnyVariantSelected ? 'border-2 border-blue-500' : 'border border-gray-600'
                  }`}
                  onClick={() => handleCardSelect(currentVariant)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isAnyVariantSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCardSelection(currentVariant.id, e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500"
                  />



                  {/* Player Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm">
                      {currentVariant.playerName || 'Joueur Inconnu'}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {currentVariant.teamName || 'Équipe Inconnue'}
                    </p>
                  </div>

                  {/* Variants Count */}
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">
                      {variants.length} variant{variants.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {variants.filter(v => v.isOwned).length} / {variants.length} possédées
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="w-3 h-3 rounded-full flex-shrink-0" 
                       style={{ backgroundColor: currentVariant.isOwned ? '#10B981' : '#EF4444' }}>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 bg-[hsl(214,35%,22%)] border-b border-gray-700 sticky top-0 z-10">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">
                  {selectedCard.playerName || 'Joueur Inconnu'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {selectedCard.teamName || 'Équipe Inconnue'}
                </p>
                <div className="flex gap-2 text-xs text-blue-400 mt-1">
                  {collection?.name && <span>Collection: {collection.name}</span>}
                  {selectedCard.season && <span>• Saison {selectedCard.season}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Options button clicked");
                    setShowOptionsPanel(true);
                  }}
                  className="text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all z-20"
                  type="button"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable content */}
            <div className="flex-1 bg-[hsl(216,46%,13%)] overflow-y-auto">
              {(() => {
                const currentCard = getCurrentCard();
                const variants = getCardVariants(selectedCard);
                
                return (
                  <div className="p-6 space-y-6">
                    {/* Card Carousel with Touch Support */}
                    <div className="w-full max-w-md mx-auto relative">
                      {(() => {
                        const variants = getCardVariants(selectedCard);
                        if (variants.length <= 1) {
                          return currentCard?.imageUrl ? (
                            <div 
                              className="relative w-full h-96 perspective-1000"
                              style={{ perspective: '1000px' }}
                            >
                              <img 
                                src={currentCard.imageUrl} 
                                alt={`${currentCard.playerName} card`}
                                className={`w-full h-full object-cover rounded-lg transition-transform duration-500 ${starEffectCards.has(currentCard.id) ? 'animate-sparkle-stars' : ''}`}
                                style={{
                                  transformStyle: 'preserve-3d',
                                  willChange: 'transform',
                                  animation: 'card-auto-float 12s ease-in-out infinite'
                                }}
                              />
                              {/* Featured Star on Photo */}
                              {currentCard.isFeatured && (
                                <div className="absolute top-3 right-3 z-20">
                                  <div className="bg-yellow-500 rounded-full p-2 shadow-lg">
                                    <Star className="w-4 h-4 text-white fill-current" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-96 bg-gray-600 rounded-lg flex items-center justify-center">
                              <HelpCircle className="w-16 h-16 text-gray-400" />
                            </div>
                          );
                        }

                        // Carousel pour multiple variantes
                        const currentIndex = currentVariantIndex;
                        
                        return (
                          <div 
                            className="relative w-full h-96 overflow-hidden rounded-lg"
                            onTouchStart={(e) => {
                              const touch = e.touches[0];
                              // Store touch start position, not variant index
                              e.currentTarget.setAttribute('data-touch-start', touch.clientX.toString());
                            }}
                            onTouchMove={(e) => {
                              e.preventDefault();
                            }}
                            onTouchEnd={(e) => {
                              const touch = e.changedTouches[0];
                              const startX = parseFloat(e.currentTarget.getAttribute('data-touch-start') || '0');
                              const diffX = startX - touch.clientX;
                              
                              if (Math.abs(diffX) > 50) {
                                if (diffX > 0 && currentVariantIndex < variants.length - 1) {
                                  setCurrentVariantIndex(prev => prev + 1);
                                } else if (diffX < 0 && currentVariantIndex > 0) {
                                  setCurrentVariantIndex(prev => prev - 1);
                                }
                              }
                            }}
                          >
                            {currentCard?.imageUrl ? (
                              <div className="relative w-full h-full">
                                <img 
                                  src={currentCard.imageUrl} 
                                  alt={`${currentCard.playerName} card`}
                                  className={`w-full h-full object-cover transition-transform duration-300 ${starEffectCards.has(currentCard.id) ? 'animate-sparkle-stars' : ''}`}
                                  style={{
                                    transformStyle: 'preserve-3d',
                                    willChange: 'transform',
                                    animation: 'card-auto-float 12s ease-in-out infinite'
                                  }}
                                />
                                {/* Featured Star on Carousel Photo */}
                                {currentCard.isFeatured && (
                                  <div className="absolute top-3 right-3 z-20">
                                    <div className="bg-yellow-500 rounded-full p-2 shadow-lg">
                                      <Star className="w-4 h-4 text-white fill-current" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                <HelpCircle className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      
                      {/* Navigation Arrows for Variants */}
                      {(() => {
                        const variants = getCardVariants(selectedCard);

                        if (variants.length <= 1) return null;
                        
                        const currentIndex = variants.findIndex(v => v.id === currentCard?.id);
                        
                        return (
                          <>
                            {/* Previous Arrow */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentVariantIndex(prev => prev > 0 ? prev - 1 : variants.length - 1);
                              }}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all z-20"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                            
                            {/* Next Arrow */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentVariantIndex(prev => prev < variants.length - 1 ? prev + 1 : 0);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all z-20"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                            
                            {/* Variant Counter */}
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                              {currentVariantIndex + 1} / {variants.length}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Card Details */}
                    <div className="space-y-4 bg-[hsl(214,35%,22%)] p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">
                          {currentCard?.cardType === "Parallel Numbered" ? "Parallèle numérotée" : currentCard?.cardType || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Numérotation:</span>
                        <span className="text-white">
                          {(() => {
                            if (!currentCard?.numbering) return 'N/A';
                            
                            let numbering = currentCard.numbering.replace(/^\d+/, '');
                            
                            // Pour les bases numérotées, ajouter laser/swirl selon le cardSubType
                            if (currentCard.cardType === "Parallel Numbered" && currentCard.cardSubType) {
                              const subType = currentCard.cardSubType.toLowerCase();
                              if (subType === 'laser') {
                                numbering += ' laser';
                              } else if (subType === 'swirl') {
                                numbering += ' swirl';
                              }
                            }
                            
                            return numbering;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Statut:</span>
                        <span className={currentCard?.isOwned ? "text-green-400" : "text-red-400"}>
                          {currentCard?.isOwned ? "Possédée" : "Manquante"}
                        </span>
                      </div>
                      {/* Dispo à la vente */}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dispo à la vente:</span>
                        <span className="text-white">
                          {currentCard?.isForTrade ? (
                            currentCard?.tradeOnly ? "Trade uniquement" : 
                            currentCard?.tradePrice ? `Vente et trade - ${currentCard.tradePrice}` : 
                            "Vente et trade"
                          ) : "Non renseigné"}
                        </span>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4 bg-[hsl(214,35%,22%)] p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-white">Informations supplémentaires</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">Collection: SCORE LIGUE 1</p>
                        <p className="text-gray-300">Saison: 2023-24</p>
                        <p className="text-gray-300">
                          Rareté: 
                          <span 
                            className="ml-2 px-2 py-1 rounded text-xs font-medium"
                            style={{
                              color: getRarityInfo(determineRarity(currentCard?.cardType || '', currentCard?.numbering)).color,
                              backgroundColor: getRarityInfo(determineRarity(currentCard?.cardType || '', currentCard?.numbering)).bgColor
                            }}
                          >
                            {getRarityInfo(determineRarity(currentCard?.cardType || '', currentCard?.numbering)).labelFr}
                          </span>
                        </p>
                      </div>
                    </div>


                  </div>
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
            <p className="text-sm opacity-75">Bouge ta souris ou ton doigt pour faire pivoter la carte</p>
          </div>
        </div>
      )}

      {/* Options Panel - Replit-style */}
      {showOptionsPanel && selectedCard && (
        <div 
          className="fixed inset-0 z-[70]"
          onClick={() => setShowOptionsPanel(false)}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>
          
          {/* Panel */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[hsl(214,35%,22%)] rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out"
            style={{
              animation: 'slideInFromBottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              height: '50vh',
              minHeight: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-400 rounded-full"></div>
            </div>
            
            <div className="px-6 pb-8 h-full overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-6 text-center">Options</h3>
            
              <div className="space-y-2">
                {/* Proposer à l'échange */}
                <button
                  onClick={() => {
                    setSelectedTradeCard(selectedCard);
                    setShowTradePanel(true);
                    setShowOptionsPanel(false);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all flex items-center gap-3 shadow-sm"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Handshake className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm">Proposer à l'échange</span>
                </button>

                {/* Photo action */}
                {(() => {
                  const currentCard = getCurrentCard();
                  const hasPhoto = currentCard?.imageUrl;
                  
                  return (
                    <button
                      onClick={() => {
                        if (hasPhoto) {
                          updateCardImageMutation.mutateAsync({
                            cardId: currentCard.id,
                            imageUrl: ""
                          }).then(() => {
                            toast({
                              title: "Photo supprimée",
                              description: "La photo de la carte a été supprimée avec succès."
                            });
                          }).catch(() => {
                            toast({
                              title: "Erreur",
                              description: "Impossible de supprimer la photo.",
                              variant: "destructive"
                            });
                          });
                        } else {
                          setShowPhotoUpload(true);
                        }
                        setShowOptionsPanel(false);
                      }}
                      className="w-full bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all flex items-center gap-3 shadow-sm"
                    >
                      <div className={`w-8 h-8 ${hasPhoto ? 'bg-red-600' : 'bg-orange-500'} rounded-lg flex items-center justify-center`}>
                        {hasPhoto ? 
                          <Trash2 className="w-5 h-5 text-white" /> : 
                          <Camera className="w-5 h-5 text-white" />
                        }
                      </div>
                      <span className="text-sm">{hasPhoto ? 'Supprimer la photo' : 'Ajouter une photo'}</span>
                    </button>
                  );
                })()}

                {/* Statut de possession */}
                <button
                  onClick={async () => {
                    try {
                      const currentCard = getCurrentCard();
                      if (selectedCard.isOwned) {
                        await handleMarkAsNotOwned(currentCard?.id || selectedCard.id);
                      } else {
                        await handleMarkAsOwned(currentCard?.id || selectedCard.id, false);
                      }
                      setShowOptionsPanel(false);
                    } catch (error) {
                      toast({
                        title: "Erreur",
                        description: "Impossible de modifier le statut de la carte.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all flex items-center gap-3 shadow-sm"
                >
                  <div className={`w-8 h-8 ${selectedCard.isOwned ? 'bg-red-600' : 'bg-green-600'} rounded-lg flex items-center justify-center`}>
                    {selectedCard.isOwned ? 
                      <Minus className="w-5 h-5 text-white" /> : 
                      <Check className="w-5 h-5 text-white" />
                    }
                  </div>
                  <span className="text-sm">{selectedCard.isOwned ? 'Marquer comme manquante' : 'Marquer comme acquise'}</span>
                </button>

                {/* Mettre à la une */}
                <button
                  onClick={async () => {
                    try {
                      const currentCard = getCurrentCard();
                      const cardId = currentCard?.id || selectedCard.id;
                      const newFeaturedStatus = !currentCard?.isFeatured;
                      
                      // Fermer le panel immédiatement pour un feedback rapide
                      setShowOptionsPanel(false);
                      
                      // Mettre à jour l'état local immédiatement pour l'affichage de l'étoile
                      if (selectedCard && selectedCard.id === cardId) {
                        setSelectedCard({ ...selectedCard, isFeatured: newFeaturedStatus });
                      }
                      
                      // Mettre à jour le cache immédiatement
                      queryClient.setQueryData([`/api/collections/${collectionId}/cards`], (oldData: Card[] | undefined) => {
                        if (!oldData) return oldData;
                        return oldData.map(card => 
                          card.id === cardId ? { ...card, isFeatured: newFeaturedStatus } : card
                        );
                      });
                      
                      await updateCardFeaturedMutation.mutateAsync({ 
                        cardId, 
                        isFeatured: newFeaturedStatus 
                      });
                      
                      toast({
                        title: newFeaturedStatus ? "Mise à la une" : "Retirée de la une",
                        description: newFeaturedStatus 
                          ? "Cette carte a été mise à la une de ta collection." 
                          : "Cette carte a été retirée de la une.",
                        className: "bg-yellow-900 border-yellow-700 text-yellow-100",
                      });
                    } catch (error) {
                      // En cas d'erreur, rétablir l'état précédent
                      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
                      toast({
                        title: "Erreur",
                        description: "Impossible de modifier le statut de la carte.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all flex items-center gap-3 shadow-sm"
                >
                  <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm">
                    {(() => {
                      const currentCard = getCurrentCard();
                      return currentCard?.isFeatured ? "Retirer de la une" : "Mettre à la une";
                    })()}
                  </span>
                </button>
              </div>
            </div>
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
              description: "Impossible de sauvegarder la photo. Vérifie ta connexion.",
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