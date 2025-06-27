import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Filter, Camera, LayoutGrid, Layers, Trophy, Star, Zap, Award, Users, TrendingUp, Package, Trash2, AlertTriangle, CreditCard, FileText, CreditCard as CardIcon, MoreVertical, X, Edit, Eye, DollarSign, RefreshCw, Check, CheckCircle, BookOpen } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";

import CardDisplay from "../components/card-display";
import LoadingScreen from "@/components/LoadingScreen";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import avatarImage from "@assets/image_1750196240581.png";
import cardStackIcon from "@assets/image_1750351528484.png";
import goldCardsImage from "@assets/2ba6c853-16ca-4c95-a080-c551c3715411_1750361216149.png";
import goldenCardsIcon from "@assets/2ba6c853-16ca-4c95-a080-c551c3715411_1750366562526.png";
import type { User, Collection, Card } from "@shared/schema";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import { MilestoneDetector, type MilestoneData } from "@/utils/milestoneDetector";
import MilestoneTestTriggers from "@/utils/milestoneTestTriggers";
import TrophyAvatar from "@/components/TrophyAvatar";

const getThemeGradient = (themeColors: string) => {
  const themeStyles: Record<string, string> = {
    "main+background": "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)",
    "white+sky": "linear-gradient(135deg, #ffffff 0%, #0ea5e9 100%)",
    "red+navy": "linear-gradient(135deg, #dc2626 0%, #1e3a8a 100%)",
    "navy+bronze": "linear-gradient(135deg, #1e3a8a 0%, #a3a3a3 100%)",
    "white+red": "linear-gradient(135deg, #ffffff 0%, #dc2626 100%)",
    "white+blue": "linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)",
    "gold+black": "linear-gradient(135deg, #fbbf24 0%, #000000 100%)",
    "green+white": "linear-gradient(135deg, #22c55e 0%, #ffffff 100%)",
    "red+black": "linear-gradient(135deg, #dc2626 0%, #000000 100%)",
    "blue+white+red": "linear-gradient(135deg, #3b82f6 0%, #ffffff 50%, #dc2626 100%)"
  };
  return themeStyles[themeColors] || "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)";
};

const getThemeTextColor = (themeColors: string) => {
  const lightThemes = ["white+sky", "white+red", "white+blue", "green+white"];
  return lightThemes.includes(themeColors) ? "#000000" : "#ffffff";
};


export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"cards" | "collections" | "deck">("cards");
  const [viewMode, setViewMode] = useState<"grid" | "gallery" | "carousel" | "list">("list");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showCardFullscreen, setShowCardFullscreen] = useState(false);
  const [isCardRotated, setIsCardRotated] = useState(false);
  const [rotationStyle, setRotationStyle] = useState({ rotateX: 0, rotateY: 0 });
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [showFeaturedPanel, setShowFeaturedPanel] = useState(false);
  const [featuredDescription, setFeaturedDescription] = useState("");
  const [salePrice, setSalePrice] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);
  const [saleFilter, setSaleFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Milestone celebration state
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneData | null>(null);
  const [collectionCompletions, setCollectionCompletions] = useState<Record<number, any>>({});
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/users/1/collections"],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Query pour les cartes personnelles
  const { data: personalCards = [], isLoading: personalCardsLoading } = useQuery<any[]>({
    queryKey: ["/api/personal-cards"],
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === "cards",
  });

  // Query pour les decks de l'utilisateur
  const { data: userDecks = [], isLoading: decksLoading, refetch: refetchDecks } = useQuery<any[]>({
    queryKey: ["/api/decks"],
    staleTime: 0, // Force refresh des données
    gcTime: 0, // Pas de cache persistant
    enabled: activeTab === "deck",
  });

  // Effet pour rafraîchir les decks quand on change d'onglet
  useEffect(() => {
    if (activeTab === "deck") {
      refetchDecks();
    }
  }, [activeTab, refetchDecks]);

  // Query pour obtenir les détails complets des decks avec cartes pour prévisualisation
  const { data: deckPreviews = [] } = useQuery({
    queryKey: ['/api/decks/previews'],
    queryFn: async () => {
      if (!userDecks?.length) return [];
      
      const previews = await Promise.all(
        userDecks.map(async (deck: any) => {
          try {
            const response = await fetch(`/api/decks/${deck.id}`);
            if (response.ok) {
              const deckWithCards = await response.json();
              return {
                ...deck,
                previewCards: deckWithCards.cards.slice(0, 3)
              };
            }
            return { ...deck, previewCards: [] };
          } catch {
            return { ...deck, previewCards: [] };
          }
        })
      );
      return previews;
    },
    enabled: activeTab === "deck" && !!userDecks?.length,
  });

  // Filtrer et rechercher les cartes personnelles
  const filteredPersonalCards = personalCards.filter(card => {
    // Filtre par statut de vente
    if (saleFilter === 'available') {
      // En vente : cartes avec isForTrade=true ET un prix, mais pas vendues
      if (!card.isForTrade || !card.tradePrice || card.isSold) return false;
    } else if (saleFilter === 'sold') {
      // Vendues : seulement les cartes avec isSold=true
      if (!card.isSold) return false;
    } 
    // Pour 'all', on affiche toutes les cartes sans filtrage par statut de vente
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const playerMatch = card.playerName?.toLowerCase().includes(query);
      const teamMatch = card.teamName?.toLowerCase().includes(query);
      return playerMatch || teamMatch;
    }
    
    return true;
  });

  // Générer les suggestions d'autocomplétion
  const generateSuggestions = (query: string) => {
    if (!query.trim()) return [];
    
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();
    
    personalCards.forEach(card => {
      if (card.playerName && card.playerName.toLowerCase().includes(queryLower)) {
        suggestions.add(card.playerName);
      }
      if (card.teamName && card.teamName.toLowerCase().includes(queryLower)) {
        suggestions.add(card.teamName);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  };

  // Mettre à jour les suggestions quand la recherche change
  // Gérer le paramètre tab dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'decks') {
      setActiveTab('deck');
    }
  }, []);

  useEffect(() => {
    if (personalCards.length === 0) return;
    
    const suggestions = generateSuggestions(searchQuery);
    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0 && searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Fonction pour calculer le pourcentage de completion en utilisant les données de la collection
  const getCollectionCompletion = (collection: Collection) => {
    // Utiliser d'abord les données de la collection si disponibles
    if (collection.totalCards && collection.ownedCards !== undefined) {
      return {
        totalCards: collection.totalCards,
        ownedCards: collection.ownedCards,
        percentage: Math.round((collection.ownedCards / collection.totalCards) * 100)
      };
    }
    
    // Valeurs par défaut si pas de données
    return { totalCards: 0, ownedCards: 0, percentage: 0 };
  };

  // Query for all user cards when no collection is selected
  const { data: allUserCardsResponse } = useQuery<{cards: Card[], pagination?: any}>({
    queryKey: ["/api/cards/all"],
    enabled: !selectedCollection && activeTab === "cards",
  });

  // Query for specific collection cards
  const { data: cardsResponse } = useQuery<{cards: Card[], pagination?: any}>({
    queryKey: [`/api/collections/${selectedCollection}/cards`],
    enabled: !!selectedCollection && activeTab === "cards",
  });

  // Extract cards from response - use all user cards if no collection selected
  const cards = selectedCollection 
    ? (cardsResponse?.cards || [])
    : (Array.isArray(allUserCardsResponse) ? allUserCardsResponse : (allUserCardsResponse?.cards || []));

  // Effect to check for milestones when collections data changes
  useEffect(() => {
    if (!collections || collections.length === 0) return;

    // Calculate all collection completions
    const newCompletions: Record<number, any> = {};
    
    collections.forEach(collection => {
      const completion = getCollectionCompletion(collection);
      newCompletions[collection.id] = completion;

      // Check for milestones if we have previous data to compare
      const previousCompletion = collectionCompletions[collection.id];
      
      if (previousCompletion && completion.percentage !== previousCompletion.percentage) {
        // Check for completion milestones
        const milestone = MilestoneDetector.checkAllMilestones(
          collection as any,
          completion,
          previousCompletion,
          collections as any,
          newCompletions
        );

        if (milestone) {
          setCurrentMilestone(milestone);
        }
      }
    });

    // Update the completions state
    setCollectionCompletions(newCompletions);
  }, [collections, collectionCompletions]);

  // Effect to check for first collection milestone when user first loads the app
  useEffect(() => {
    if (!collections || collections.length === 0) return;
    
    // Check for first collection milestone only once
    const completions: Record<number, any> = {};
    collections.forEach(collection => {
      completions[collection.id] = getCollectionCompletion(collection);
    });

    const firstCollectionMilestone = MilestoneDetector.checkFirstCollectionMilestone(
      collections as any,
      completions
    );

    if (firstCollectionMilestone) {
      setCurrentMilestone(firstCollectionMilestone);
    }
  }, [collections]); // Only run when collections first load

  // Development helper: Add test milestone triggers
  useEffect(() => {
    // Add global functions for testing milestones
    if (typeof window !== 'undefined') {
      (window as any).testMilestone = (type?: string) => {
        const milestone = MilestoneTestTriggers.createTestMilestone(type as any || 'completion');
        setCurrentMilestone(milestone);
      };

      (window as any).testRandomMilestone = () => {
        const milestone = MilestoneTestTriggers.getRandomMilestone();
        setCurrentMilestone(milestone);
      };

      (window as any).testCompletionMilestone = (percentage: number) => {
        const milestone = MilestoneTestTriggers.createCompletionMilestone(percentage);
        setCurrentMilestone(milestone);
      };
    }
  }, []);

  // Mutation pour mettre à jour les paramètres de vente
  const updateSaleSettingsMutation = useMutation({
    mutationFn: async ({ cardId, price, description, tradeOnly }: {
      cardId: number;
      price: string;
      description: string;
      tradeOnly: boolean;
    }) => {
      console.log("Saving sale settings:", { cardId, price, description, tradeOnly });
      // Utiliser la route pour cartes personnelles
      return apiRequest("PATCH", `/api/personal-cards/${cardId}/sale-settings`, {
        isForTrade: true,
        tradePrice: price,
        tradeDescription: description,
        tradeOnly
      });
    },
    onSuccess: (updatedCard) => {
      // Mettre à jour les cartes personnelles
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de vente ont été mis à jour.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowTradePanel(false);
      setShowOptionsPanel(false);
      setSelectedCard(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour retirer de la vente
  const removeFromSaleMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return apiRequest("PATCH", `/api/personal-cards/${cardId}/sale-settings`, {
        isForTrade: false,
        tradePrice: null,
        tradeDescription: null,
        tradeOnly: false
      });
    },
    onSuccess: (updatedCard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      
      toast({
        title: "Carte retirée de la vente",
        description: "La carte n'est plus disponible à la vente.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowOptionsPanel(false);
      setSelectedCard(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de retirer la carte de la vente.",
        variant: "destructive",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      return apiRequest("DELETE", `/api/collections/${collectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      toast({
        title: "Collection supprimée",
        description: "La collection a été supprimée avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
      setShowDeleteModal(false);
      setCollectionToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la collection.",
        variant: "destructive"
      });
    }
  });

  // Mutation pour supprimer une carte
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return apiRequest("DELETE", `/api/personal-cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      
      toast({
        title: "Carte supprimée",
        description: "La carte a été supprimée avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowDeleteCardModal(false);
      setCardToDelete(null);
      setShowOptionsPanel(false);
      setSelectedCard(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la carte.",
        variant: "destructive"
      });
    }
  });

  const handleMarkAsSold = async () => {
    if (!selectedCard) return;
    
    try {
      await apiRequest("PATCH", `/api/personal-cards/${selectedCard.id}/sale-settings`, {
        isSold: true,
        isForTrade: false
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      
      toast({
        title: "Carte marquée comme vendue",
        description: "La carte est maintenant disponible dans l'onglet 'Vendues'.",
        className: "bg-green-600 text-white border-green-700"
      });
      setShowOptionsPanel(false);
      setSelectedCard(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme vendue.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromSale = () => {
    if (!selectedCard) return;
    removeFromSaleMutation.mutate(selectedCard.id);
  };

  const handleDeleteCollection = (collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate(collectionToDelete.id);
    }
  };

  const handleDeleteCard = (card: Card) => {
    setCardToDelete(card);
    setShowDeleteCardModal(true);
    setShowOptionsPanel(false);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete) {
      deleteCardMutation.mutate(cardToDelete.id);
    }
  };

  const handleTabChange = (tab: "collections" | "cards" | "deck") => {
    setActiveTab(tab);
    if (tab === "collections") {
      setSelectedCollection(null);
    }
  };

  const handleSaveSaleSettings = () => {
    if (!selectedCard) return;
    
    updateSaleSettingsMutation.mutate({
      cardId: selectedCard.id,
      price: salePrice,
      description: saleDescription,
      tradeOnly: tradeOnly
    });
    
    setSalePrice('');
    setSaleDescription('');
    setTradeOnly(false);
    setShowTradePanel(false);
  };

  if (userLoading || collectionsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title="Mes cartes" />
      <main className="relative z-10 px-4 pb-24">
        {/* User Profile Section */}
        {user && (
          <div className="flex flex-col items-center text-center mb-4 mt-2">
            <TrophyAvatar 
              userId={user.id}
              avatar={user.avatar || undefined}
              size="lg"
            />
            <h2 className="text-xl font-bold text-white mb-2 font-luckiest">{user.name || user.username}</h2>
            <div className="flex items-center space-x-4 text-sm text-[hsl(212,23%,69%)]">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">
                  {(() => {
                    // Compter les cartes des collections
                    const collectionCards = collections?.reduce((total, collection) => {
                      const completion = getCollectionCompletion(collection);
                      return total + completion.ownedCards;
                    }, 0) || 0;
                    
                    // Compter les cartes personnelles (excepté les vendues)
                    const personalCardsCount = personalCards?.filter(card => !card.isSold).length || 0;
                    
                    return collectionCards + personalCardsCount;
                  })()}
                </span>
                <span>cartes</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{userDecks?.length || 0}</span>
                <span>decks</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{user.followersCount || 0}</span>
                <span>abonnés</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex space-x-2 bg-[hsl(214,35%,22%)] rounded-xl p-1 min-w-max">
            <button
              onClick={() => handleTabChange("cards")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "cards" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <CardIcon className="w-4 h-4" />
              Cartes
            </button>

            <button
              onClick={() => handleTabChange("collections")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "collections" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <Layers className="w-4 h-4" />
              Collections
            </button>

            <button
              onClick={() => handleTabChange("deck")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "deck" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Decks
            </button>

          </div>
        </div>

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Collections</h3>
            {/* Add Collection Button - Moved to top */}
            <div 
              onClick={() => setLocation("/add-card")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-base">Nouvelle Collection</h3>
            </div>

            {collections?.map((collection) => {
              const completion = getCollectionCompletion(collection);
              return (
                <div key={collection.id}>
                  <div 
                    onClick={() => {
                      setLocation(`/collection/${collection.id}`);
                    }}
                    className="w-full bg-gradient-radial from-[hsl(214,35%,22%)] from-0% to-[hsl(216,46%,13%)] to-100% rounded-2xl overflow-hidden cursor-pointer group relative transform transition-all duration-300 hover:scale-[1.02] border-2 border-yellow-500/50 hover:border-yellow-400/70"
                  >
                    {/* Header with title and delete button */}
                    <div className="p-4 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white font-poppins text-lg">{collection.name}</h3>
                          <p className="text-white/60 text-sm italic">{collection.season || 'Saison non spécifiée'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {!collection.name?.includes("SCORE LIGUE 1") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCollection(collection);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                              title="Supprimer la collection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card display area */}
                    <div className="h-32 relative flex items-center justify-center overflow-hidden px-4 pb-3">
                      <div className="relative w-full max-w-md h-32 flex items-center justify-center">
                        {/* Main card with golden cards image and effects */}
                        <div className="relative w-32 h-32 bg-gradient-to-br from-yellow-900/30 via-yellow-800/40 to-amber-900/50 rounded-2xl p-3 shadow-2xl flex items-center justify-center border border-yellow-500/20 group hover:scale-105 transition-all duration-300">
                          {/* Golden glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-amber-500/5 to-yellow-600/10 rounded-2xl animate-pulse"></div>
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent rounded-2xl transform -skew-x-12 animate-shimmer"></div>
                          
                          <img 
                            src={goldenCardsIcon}
                            alt="Golden trading cards"
                            className="w-24 h-24 object-contain rounded-lg relative z-10 filter drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300"
                            style={{
                              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.3)) brightness(1.1) contrast(1.1)'
                            }}
                          />
                          
                          {/* Sparkle effects */}
                          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse delay-300"></div>
                          <div className="absolute top-1/2 left-2 w-1 h-1 bg-yellow-500 rounded-full animate-pulse delay-700"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="px-4 pb-4">
                      <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                        <div 
                          className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completion.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>{completion.percentage}% complété</span>
                        <span>{completion.ownedCards} cartes acquises</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* Cards Tab Content - Personal Cards */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-poppins">Mes cartes</h3>
              
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "list" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "grid" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Bar with Autocomplete */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par joueur ou équipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 bg-[hsl(214,35%,15%)] border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(214,35%,18%)] border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-[hsl(214,35%,25%)] transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Buttons with Add Button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSaleFilter('all')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    saleFilter === 'all' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setSaleFilter('available')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    saleFilter === 'available' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  En vente
                </button>
                <button
                  onClick={() => setSaleFilter('sold')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    saleFilter === 'sold' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Vendues
                </button>
              </div>
              
              <button
                onClick={() => setLocation("/add-card")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {personalCardsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPersonalCards && filteredPersonalCards.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPersonalCards.map((card: any) => (
                    <div 
                      key={card.id} 
                      className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer relative ${card.isSold ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.isSold && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                          <div className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm">
                            VENDUE
                          </div>
                        </div>
                      )}
                      {card.imageUrl && (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName || 'Carte'}`}
                          className={`w-full h-32 object-cover rounded-md mb-2 ${card.isSold ? 'grayscale' : ''}`}
                        />
                      )}
                      <div className="space-y-1">
                        {card.playerName && (
                          <h4 className="text-white font-medium text-sm truncate">{card.playerName}</h4>
                        )}
                        {card.teamName && (
                          <p className="text-gray-400 text-xs truncate">{card.teamName}</p>
                        )}
                        <p className="text-gray-500 text-xs">{card.cardType}</p>
                        {!card.isSold && card.isForTrade && card.tradePrice && (
                          <div className="flex items-center gap-1 mt-2">
                            <DollarSign className="w-3 h-3 text-primary" />
                            <span className="text-primary text-xs font-medium">{card.tradePrice}€</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List view
                <div className="space-y-3">
                  {filteredPersonalCards.map((card: any) => (
                    <div 
                      key={card.id} 
                      className={`bg-[hsl(214,35%,22%)] rounded-lg p-4 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer flex items-center gap-4 relative ${card.isSold ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.isSold && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full font-bold text-xs z-10">
                          VENDUE
                        </div>
                      )}
                      {card.imageUrl && (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName || 'Carte'}`}
                          className={`w-20 h-28 object-cover rounded-md flex-shrink-0 ${card.isSold ? 'grayscale' : ''}`}
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        {card.playerName && (
                          <h4 className="text-white font-medium">{card.playerName}</h4>
                        )}
                        {card.teamName && (
                          <p className="text-gray-400 text-sm">{card.teamName}</p>
                        )}
                        <p className="text-gray-500 text-sm">{card.cardType}</p>
                      </div>
                      {!card.isSold && card.isForTrade && card.tradePrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">{card.tradePrice}€</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <CardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune carte trouvée</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  {searchQuery ? "Aucune carte ne correspond à votre recherche." : "Ajoute tes cartes personnelles pour les organiser et les mettre en vente."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deck Tab Content */}
        {activeTab === "deck" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Decks</h3>
            
            {/* Add Deck Button */}
            <div 
              onClick={() => setLocation("/create-deck")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-base">Nouveau Deck</h3>
            </div>

            {/* Decks List */}
            {decksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[hsl(214,35%,22%)] rounded-2xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-20 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : userDecks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                </div>
                <div className="text-gray-400 mb-4 text-lg">
                  Tu n'as pas encore créé de deck.
                </div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Crée ton premier deck de cartes et montre-le à ta communauté.
                </p>
                <button 
                  onClick={() => setLocation("/create-deck")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Créer mon premier deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {(deckPreviews.length > 0 ? deckPreviews : userDecks).map((deck: any) => (
                  <div 
                    key={deck.id} 
                    onClick={() => {
                      // Vérifier que le deck existe avant la navigation
                      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deck.id}`] });
                      setLocation(`/deck/${deck.id}`);
                    }}
                    className="rounded-2xl p-4 border-2 border-yellow-500/50 hover:border-yellow-400/70 transition-all cursor-pointer hover:scale-[1.02] transform relative overflow-hidden"
                    style={{
                      background: deck.themeColors ? getThemeGradient(deck.themeColors) : "hsl(214,35%,22%)"
                    }}
                  >
                    {/* Effet d'étoiles filantes pour les decks complets */}
                    {deck.previewCards && deck.previewCards.length === 9 && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {Array.from({length: 8}).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-px h-8 bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-70"
                            style={{
                              top: `${-10 + Math.random() * 20}%`,
                              left: `${Math.random() * 100}%`,
                              transform: `rotate(${20 + Math.random() * 20}deg)`,
                              animation: `shooting-star ${2 + Math.random() * 3}s ease-in-out infinite`,
                              animationDelay: `${Math.random() * 4}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <h4 className="font-bold text-lg font-luckiest" style={{
                        color: deck.themeColors ? getThemeTextColor(deck.themeColors) : "#ffffff"
                      }}>{deck.name}</h4>
                      <span className="text-xs" style={{
                        color: deck.themeColors ? `${getThemeTextColor(deck.themeColors)}80` : "#9ca3af"
                      }}>{deck.cardCount}/12</span>
                    </div>
                    
                    {/* Preview des 3 premières cartes */}
                    <div className="h-32 rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 flex items-center p-3">
                      {deck.previewCards && deck.previewCards.length > 0 ? (
                        <div className="flex space-x-3 w-full perspective-1000">
                          {deck.previewCards.map((cardData: any, index: number) => (
                            <div 
                              key={index} 
                              className="flex-1 h-24 relative transform-gpu"
                              style={{
                                transform: `rotateY(${-15 + index * 15}deg) rotateX(10deg)`,
                                transformStyle: 'preserve-3d'
                              }}
                            >
                              {cardData.card.imageUrl ? (
                                <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border-2 border-white/20 relative">
                                  <img 
                                    src={cardData.card.imageUrl} 
                                    alt={cardData.card.playerName}
                                    className="w-full h-full object-cover"
                                  />

                                </div>
                              ) : (
                                <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs text-center p-2 shadow-lg border-2 border-white/20">
                                  <div>
                                    <div className="font-bold text-xs mb-1">{cardData.card.playerName}</div>
                                    <div className="text-xs opacity-80">{cardData.card.teamName}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {/* Emplacements vides pour compléter jusqu'à 3 */}
                          {Array.from({ length: 3 - deck.previewCards.length }, (_, i) => (
                            <div 
                              key={`empty-${i}`} 
                              className="flex-1 h-24 relative transform-gpu"
                              style={{
                                transform: `rotateY(${-15 + (deck.previewCards.length + i) * 15}deg) rotateX(10deg)`,
                                transformStyle: 'preserve-3d'
                              }}
                            >
                              <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs shadow-lg">
                                Vide
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full text-white font-bold">
                          Deck vide - Voir le deck
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Card Detail Modal - Fullscreen with slide animation */}
        {selectedCard && (
          <div 
            className="fixed inset-0 bg-black z-50 animate-slide-in"
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
                    {collections?.find(c => c.id === selectedCard.collectionId)?.name && (
                      <span>Collection: {collections.find(c => c.id === selectedCard.collectionId)?.name}</span>
                    )}
                    {selectedCard.season && <span>• Saison {selectedCard.season}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptionsPanel(true);
                    }}
                    className="text-white p-2 hover:bg-gray-700/30 rounded-lg transition-all z-20"
                    type="button"
                  >
                    <MoreVertical className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all z-20"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable avec scroll fluide et hauteur augmentée */}
              <div className="flex-1 overflow-y-auto bg-[hsl(216,46%,13%)] p-8 pb-20" style={{ scrollBehavior: 'smooth' }}>
                {/* Card Container avec marges augmentées */}
                <div className="max-w-lg mx-auto min-h-full pb-20">
                  {/* Card Image avec effet 3D */}
                  <div className="aspect-[3/4.5] bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 relative border border-blue-400 rounded-lg overflow-hidden mb-8">
                    {selectedCard.imageUrl ? (
                      <img 
                        src={selectedCard.imageUrl} 
                        alt={selectedCard.playerName || "Card"}
                        className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105 cursor-pointer"
                        style={{
                          animation: 'card-auto-float 8s ease-in-out infinite',
                          transformStyle: 'preserve-3d',
                          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
                        }}
                        onClick={() => {
                          setShowCardFullscreen(true);
                          setIsCardRotated(false);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-lg">#{selectedCard.reference}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Info */}
                  <div className="space-y-4 text-white">
                    {/* Collection Info - First */}
                    {selectedCard.collectionId && (
                      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                        <div className="text-primary font-medium text-sm mb-1">Collection</div>
                        <div className="text-white font-semibold">
                          {collections?.find(c => c.id === selectedCard.collectionId)?.name || 'Collection inconnue'}
                        </div>
                      </div>
                    )}

                    {/* Sale Description - If available */}
                    {selectedCard.saleDescription && (
                      <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
                        <div className="text-primary font-medium text-sm mb-2">Description de la vente</div>
                        <div className="text-gray-300 text-sm leading-relaxed">
                          {selectedCard.saleDescription}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Référence</div>
                        <div className="text-white">{selectedCard.reference}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Type</div>
                        <div className="text-white">{selectedCard.cardType}</div>
                      </div>
                    </div>
                    
                    {selectedCard.numbering && (
                      <div>
                        <div className="text-gray-400 text-sm">Numérotation</div>
                        <div className="text-white">{selectedCard.numbering}</div>
                      </div>
                    )}

                    {/* Sale Price */}
                    {selectedCard.salePrice ? (
                      <div className="bg-green-600/10 rounded-lg p-4 border border-green-600/20">
                        <div className="text-green-400 font-medium text-sm mb-1">Prix de vente</div>
                        <div className="text-green-400 font-bold text-lg">
                          {selectedCard.salePrice}€
                        </div>
                        {selectedCard.isSold && (
                          <div className="text-yellow-400 font-medium text-sm mt-1">
                            ✓ Vendue
                          </div>
                        )}
                      </div>
                    ) : selectedCard.tradePrice ? (
                      <div className="bg-green-600/10 rounded-lg p-4 border border-green-600/20">
                        <div className="text-green-400 font-medium text-sm mb-1">Prix de vente</div>
                        <div className="text-green-400 font-bold text-lg">
                          {selectedCard.tradePrice}€
                        </div>
                      </div>
                    ) : selectedCard.isForTrade ? (
                      <div className="bg-blue-600/10 rounded-lg p-4 border border-blue-600/20">
                        <div className="text-blue-400 font-medium text-sm">
                          Disponible à l'échange
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-600/10 rounded-lg p-4 border border-gray-600/20">
                        <div className="text-gray-400 font-medium text-sm">
                          Pas disponible à la vente
                        </div>
                      </div>
                    )}
                    
                    {/* Trade Info */}
                    {selectedCard.isForTrade && (
                      <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4 space-y-2">
                        <div className="text-primary font-medium text-sm">
                          {selectedCard.tradeOnly ? "Échange uniquement" : "Vente & Échange"}
                        </div>
                        
                        {selectedCard.tradePrice && !selectedCard.tradeOnly && (
                          <div className="text-green-400 font-bold">
                            {selectedCard.tradePrice}
                          </div>
                        )}
                        
                        {selectedCard.tradeDescription && (
                          <div className="text-gray-300 text-sm">
                            {selectedCard.tradeDescription}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Options Panel - Slide from bottom */}
            {showOptionsPanel && (
              <>
                <div 
                  className="fixed inset-0 bg-black/50 z-[70]"
                  onClick={() => setShowOptionsPanel(false)}
                />
                <div className="fixed bottom-0 left-0 right-0 bg-[hsl(214,35%,22%)] rounded-t-3xl z-[80] transform transition-transform duration-300 ease-out">
                  <div className="p-6 space-y-4">
                    {/* Handle bar */}
                    <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-4" />
                    
                    <h3 className="text-lg font-bold text-white mb-4 text-center">Actions</h3>
                    
                    {!selectedCard.isSold && (
                      <>

                        <button 
                          onClick={handleMarkAsSold}
                          className="w-full p-2 text-white hover:bg-green-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          Marquer comme vendue
                        </button>
                        
                        {selectedCard.isForTrade ? (
                          <button 
                            onClick={handleRemoveFromSale}
                            className="w-full p-2 text-white hover:bg-red-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                              <X className="w-4 h-4 text-white" />
                            </div>
                            Retirer de la vente
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setShowOptionsPanel(false);
                              setShowTradePanel(true);
                            }}
                            className="w-full p-2 text-white hover:bg-green-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-white" />
                            </div>
                            Mettre en vente
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteCard(selectedCard)}
                          className="w-full p-2 text-white hover:bg-red-600/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <Trash2 className="w-4 h-4 text-white" />
                          </div>
                          Supprimer la carte
                        </button>
                      </>
                    )}
                    
                    {selectedCard.isSold && (
                      <>
                        <div className="w-full p-2 text-gray-400 rounded-lg font-medium text-center">
                          <div className="text-yellow-400 font-bold mb-2">✓ Carte vendue</div>
                          <div className="text-sm">Aucune action disponible</div>
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteCard(selectedCard)}
                          className="w-full p-2 text-white hover:bg-red-600/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <Trash2 className="w-4 h-4 text-white" />
                          </div>
                          Supprimer la carte
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => {
                        setShowOptionsPanel(false);
                        setShowFeaturedPanel(true);
                      }}
                      className="w-full p-2 text-white hover:bg-yellow-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      À la une
                    </button>
                    
                    <button 
                      onClick={() => setShowOptionsPanel(false)}
                      className="w-full p-2 text-white hover:bg-blue-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      Ajouter à la sélection
                    </button>
                    
                    <button 
                      onClick={() => setShowOptionsPanel(false)}
                      className="w-full p-4 text-gray-400 hover:bg-gray-400/10 rounded-lg font-medium transition-colors text-center mt-6"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Featured Panel */}
            {showFeaturedPanel && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-md border border-[hsl(214,35%,30%)]">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">À la une</h3>
                      <button
                        onClick={() => setShowFeaturedPanel(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description du post
                        </label>
                        <textarea
                          value={featuredDescription}
                          onChange={(e) => setFeaturedDescription(e.target.value)}
                          placeholder="Partagez quelque chose sur cette carte..."
                          className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowFeaturedPanel(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={async () => {
                            if (!featuredDescription.trim() || !selectedCard) return;
                            
                            try {
                              const response = await fetch('/api/posts', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  content: featuredDescription,
                                  cardImage: selectedCard.imageUrl,
                                  cardName: selectedCard.playerName,
                                  type: 'featured'
                                })
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to create post');
                              }
                              
                              setShowFeaturedPanel(false);
                              setFeaturedDescription("");
                              setSelectedCard(null);
                              
                              toast({
                                title: "Post créé !",
                                description: "Ton post a été ajouté à la une.",
                              });
                            } catch (error) {
                              toast({
                                title: "Erreur",
                                description: "Impossible de créer le post.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={!featuredDescription.trim()}
                          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Publier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Panel */}
            {showTradePanel && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-md border border-[hsl(214,35%,30%)]">
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Paramètres de vente</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Prix de vente
                        </label>
                        <input
                          type="text"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="Ex: 15€"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={saleDescription}
                          onChange={(e) => setSaleDescription(e.target.value)}
                          placeholder="Décrivez l'état de la carte..."
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] resize-none"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="tradeOnly"
                          checked={tradeOnly}
                          onChange={(e) => setTradeOnly(e.target.checked)}
                          className="w-4 h-4 text-[hsl(9,85%,67%)] bg-gray-700 border-gray-600 rounded focus:ring-[hsl(9,85%,67%)]"
                        />
                        <label htmlFor="tradeOnly" className="text-sm text-gray-300">
                          Échange uniquement (pas de vente)
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setShowTradePanel(false)}
                        className="flex-1 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={handleSaveSaleSettings}
                        className="flex-1 p-3 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white rounded-lg font-medium transition-colors"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      

      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && collectionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 max-w-md w-full mx-4 border border-[hsl(214,35%,30%)]">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white text-center mb-2">
              Supprimer la collection
            </h3>
            
            <p className="text-[hsl(212,23%,69%)] text-center mb-6">
              Es-tu sûr de vouloir supprimer la collection "{collectionToDelete.name}" ? 
              Cette action est irréversible et supprimera toutes les cartes associées.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCollectionToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-[hsl(214,35%,30%)] text-white rounded-lg hover:bg-[hsl(214,35%,35%)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteCollection}
                disabled={deleteCollectionMutation.isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteCollectionMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de carte */}
      {showDeleteCardModal && cardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Supprimer la carte</h3>
                <p className="text-gray-400 text-sm">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 text-sm">
                Êtes-vous sûr de vouloir supprimer définitivement cette carte ?
              </p>
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <p className="text-white font-medium text-sm">{cardToDelete.playerName}</p>
                <p className="text-gray-400 text-xs">{cardToDelete.reference}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteCardModal(false);
                  setCardToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteCard}
                disabled={deleteCardMutation.isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteCardMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Fullscreen Modal */}
      {showCardFullscreen && selectedCard && selectedCard.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          onClick={() => {
            setShowCardFullscreen(false);
            setIsCardRotated(false);
          }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowCardFullscreen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Card Image */}
            <div 
              className="max-w-full max-h-full flex items-center justify-center cursor-pointer select-none"
              style={{ perspective: '1000px' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const rotateX = (e.clientY - centerY) / 20;
                const rotateY = (e.clientX - centerX) / 20;
                setRotationStyle({ rotateX: -rotateX, rotateY });
              }}
              onMouseLeave={() => {
                setRotationStyle({ rotateX: 5, rotateY: -15 });
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsCardRotated(!isCardRotated);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsCardRotated(!isCardRotated);
              }}
            >
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.playerName || "Card"}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(255,255,255,0.1))',
                  transform: isCardRotated 
                    ? `rotateY(45deg) rotateX(15deg) scale(1.05)`
                    : `rotateY(${rotationStyle.rotateY}deg) rotateX(${rotationStyle.rotateX}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: isCardRotated ? 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s ease-out',
                  background: `linear-gradient(
                    ${45 + rotationStyle.rotateY}deg, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0.05) 50%, 
                    rgba(0,0,0,0.1) 100%
                  )`,
                  boxShadow: `
                    0 0 0 8px rgba(255,215,0,0.3),
                    0 0 0 16px rgba(255,215,0,0.1),
                    ${20 + rotationStyle.rotateY / 2}px ${20 + rotationStyle.rotateX / 2}px 60px rgba(0,0,0,0.8),
                    inset -5px -5px 15px rgba(0,0,0,0.3),
                    inset 5px 5px 15px rgba(255,255,255,${0.1 + Math.abs(rotationStyle.rotateX) / 1000})
                  `,
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      <MilestoneCelebration 
        milestone={currentMilestone}
        onClose={() => setCurrentMilestone(null)}
      />

      {/* Development Test Button - Hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            const milestone = MilestoneTestTriggers.getRandomMilestone();
            setCurrentMilestone(milestone);
          }}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110"
          title="Test Milestone Celebration"
        >
          <Star className="w-6 h-6" />
        </button>
      )}

      <Navigation />
    </div>
  );
}