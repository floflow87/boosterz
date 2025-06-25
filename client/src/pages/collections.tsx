import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Filter, Camera, LayoutGrid, Layers, Trophy, Star, Zap, Award, Users, TrendingUp, Package, Trash2, AlertTriangle, CreditCard, FileText, CreditCard as CardIcon, MoreVertical, X, Edit, Eye, DollarSign, RefreshCw, Check, CheckCircle, BookOpen, ArrowLeft, Bell, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      {/* Header */}
      <div className="relative px-4 py-3 flex items-center justify-between bg-[hsl(214,35%,11%)] border-b border-[hsl(214,35%,30%)]">
        <button 
          onClick={() => setLocation('/social')}
          className="w-10 h-10 rounded-full bg-[hsl(214,35%,22%)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[hsl(214,35%,25%)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <h1 className="text-lg font-['Luckiest_Guy'] text-white">
              BOOSTER<span className="text-[hsl(9,85%,67%)]">Z</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 rounded-full bg-[hsl(214,35%,22%)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[hsl(214,35%,25%)] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-[hsl(214,35%,22%)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[hsl(214,35%,25%)] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="p-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Collections</h2>
          <p className="text-gray-400">Manage your trading card collections</p>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-8 text-center">
            <p className="text-white mb-4">Collections page is being rebuilt...</p>
            <button 
              onClick={() => setLocation('/social')}
              className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Return to Social
            </button>
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}