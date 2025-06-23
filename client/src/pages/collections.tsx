import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Filter, Camera, LayoutGrid, Layers, CreditCard, Star, Zap, Award, Users, TrendingUp, BookOpen, Trash2, AlertTriangle, FileText, CreditCard as CardIcon, MoreVertical, X, Edit, Eye, DollarSign, RefreshCw, Check, CheckCircle } from "lucide-react";
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


export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"cards" | "collections" | "deck">("cards");
  const [viewMode, setViewMode] = useState<"grid" | "gallery" | "carousel" | "list">("list");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);
  const [saleFilter, setSaleFilter] = useState<'all' | 'available' | 'sold'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Filtrer et rechercher les cartes personnelles
  const filteredPersonalCards = personalCards.filter(card => {
    // Filtre par statut de vente
    if (saleFilter === 'available') {
      // En vente : cartes avec isForTrade=true ou salePrice défini, mais pas vendues
      const isForSale = card.isForTrade || card.salePrice || card.tradePrice;
      if (!isForSale || card.isSold) return false;
    } else if (saleFilter === 'sold') {
      // Vendues : seulement les cartes avec isSold=true
      if (!card.isSold) return false;
    } else if (saleFilter === 'all') {
      // Toutes : toutes les cartes sauf les vendues
      if (card.isSold) return false;
    }
    
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



  // Mutation pour mettre à jour les paramètres de vente
  const updateSaleSettingsMutation = useMutation({
    mutationFn: async ({ cardId, price, description, tradeOnly }: {
      cardId: number;
      price: string;
      description: string;
      tradeOnly: boolean;
    }) => {
      console.log("Saving sale settings:", { cardId, price, description, tradeOnly });
      return apiRequest("PATCH", `/api/personal-cards/${cardId}/sale-settings`, {
        salePrice: price,
        saleDescription: description,
        isForSale: true
      });
    },
    onSuccess: (updatedCard) => {
      // Mettre à jour les cartes personnelles
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      
      // Mettre à jour la carte sélectionnée avec les nouvelles données
      if (selectedCard && updatedCard) {
        setSelectedCard(updatedCard);
      }
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de vente ont été mis à jour.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowTradePanel(false);
      setShowOptionsPanel(false);
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
        isForSale: false,
        salePrice: null,
        saleDescription: null
      });
    },
    onSuccess: (updatedCard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      
      if (selectedCard && updatedCard) {
        setSelectedCard(updatedCard);
      }
      
      toast({
        title: "Carte retirée de la vente",
        description: "La carte n'est plus disponible à la vente.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowOptionsPanel(false);
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

  const handleMarkAsSold = async () => {
    if (!selectedCard) return;
    
    try {
      await apiRequest("PATCH", `/api/personal-cards/${selectedCard.id}/sale-settings`, {
        isSold: true,
        isForSale: false
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
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

  const handleDeleteCollection = (collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate(collectionToDelete.id);
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
  };

  const handleAddToCollection = async () => {
    if (!selectedCard) return;
    
    try {
      // Détecter la collection appropriée basée sur le contexte
      const targetCollectionId = selectedCollection || collections?.[0]?.id;
      
      if (!targetCollectionId) {
        toast({
          title: "Aucune collection disponible",
          description: "Vous devez d'abord créer une collection.",
          variant: "destructive"
        });
        return;
      }

      // Ajouter la carte à la collection avec le bon type
      const cardData = {
        collectionId: targetCollectionId,
        playerName: selectedCard.playerName,
        teamName: selectedCard.teamName,
        cardType: selectedCard.cardType || 'base',
        reference: selectedCard.reference || `${Date.now()}`,
        numbering: selectedCard.numbering,
        imageUrl: selectedCard.imageUrl,
        isOwned: true,
        isForTrade: false,
        cardSubType: selectedCard.cardSubType,
        isRookieCard: selectedCard.isRookieCard || false,
        rarity: selectedCard.rarity,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false,
        salePrice: null,
        saleDescription: null,
        isSold: false,
        isFeatured: false
      };

      await apiRequest("POST", "/api/cards", cardData);
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${targetCollectionId}/cards`] });
      
      toast({
        title: "Carte ajoutée avec succès",
        description: `La carte a été ajoutée à votre collection.`,
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowOptionsPanel(false);
      setSelectedCard(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la carte à la collection.",
        variant: "destructive"
      });
    }
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
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3 shadow-lg relative">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar utilisateur"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <img 
                  src={avatarImage} 
                  alt="Avatar par défaut"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white"
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-luckiest">{user.name || user.username}</h2>
            <div className="flex items-center space-x-4 text-sm text-[hsl(212,23%,69%)]">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">
                  {collections?.reduce((total, collection) => {
                    const completion = getCollectionCompletion(collection);
                    return total + completion.ownedCards;
                  }, 0) || 0}
                </span>
                <span>cartes</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{collections?.length || 0}</span>
                <span>collections</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{user.followersCount || 1250}</span>
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
              <CreditCard className="w-4 h-4" />
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
            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-6">Mes Collections</h2>
            
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
                    className="w-full bg-[hsl(214,35%,22%)] rounded-2xl overflow-hidden cursor-pointer group relative transform transition-all duration-300 hover:scale-[1.02]"
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
                      <div className="relative w-full max-w-md h-24 flex items-center justify-center">
                        {/* Main card with golden cards image */}
                        <div className="relative w-24 h-24 bg-gradient-to-br from-[hsl(216,46%,13%)] via-[hsl(214,35%,15%)] to-[hsl(214,35%,20%)] rounded-xl p-2 shadow-xl flex items-center justify-center">
                          <img 
                            src={goldenCardsIcon}
                            alt="Golden trading cards"
                            className="w-20 h-20 object-contain rounded-lg"
                          />
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
                      className="bg-[hsl(214,35%,22%)] rounded-lg p-3 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer"
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.imageUrl && (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName || 'Carte'}`}
                          className="w-full h-32 object-cover rounded-md mb-2"
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
                        {card.isForTrade && card.tradePrice && (
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
                      className="bg-[hsl(214,35%,22%)] rounded-lg p-4 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer flex items-center gap-4"
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.imageUrl && (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName || 'Carte'}`}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
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
                      {card.isForTrade && card.tradePrice && (
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
            <h3 className="text-3xl font-bold text-white mb-4">Mes Decks</h3>
            
            <div className="text-center py-12">
              <div className="mb-6">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              </div>
              <div className="text-gray-400 mb-4 text-lg">
                Tu n'as pas créé de deck.
              </div>
              <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Crée ton premier deck de cartes et montre-le à ta communauté.
              </p>
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4 mr-2 inline" />
                Créer mon premier deck
              </button>
            </div>
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
                  <div className="aspect-[3/4] bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 relative border border-blue-400 rounded-lg overflow-hidden mb-8">
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
                          onClick={() => {
                            setShowOptionsPanel(false);
                            setShowTradePanel(true);
                          }}
                          className="w-full p-4 text-white hover:bg-[hsl(9,85%,67%)]/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-[hsl(9,85%,67%)] rounded-lg flex items-center justify-center">
                            <Edit className="w-4 h-4 text-white" />
                          </div>
                          Paramètres de vente
                        </button>
                        
                        <button 
                          onClick={handleMarkAsSold}
                          className="w-full p-4 text-white hover:bg-green-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          Marquer comme vendue
                        </button>
                        
                        {(selectedCard.tradePrice || selectedCard.salePrice) ? (
                          <button 
                            onClick={handleRemoveFromSale}
                            className="w-full p-4 text-white hover:bg-red-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
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
                            className="w-full p-4 text-white hover:bg-green-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-white" />
                            </div>
                            Mettre en vente
                          </button>
                        )}
                      </>
                    )}
                    
                    {selectedCard.isSold && (
                      <div className="w-full p-4 text-gray-400 rounded-lg font-medium text-center">
                        <div className="text-yellow-400 font-bold mb-2">✓ Carte vendue</div>
                        <div className="text-sm">Aucune action disponible</div>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleAddToCollection}
                      className="w-full p-4 text-white hover:bg-blue-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      Ajouter à la collection
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
      
      <Navigation />
    </div>
  );
}