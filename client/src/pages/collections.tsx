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

export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"cards" | "collections" | "deck">("cards");
  const [viewMode, setViewMode] = useState<"grid" | "gallery" | "carousel" | "list">("list");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saleFilter, setSaleFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [showCardFullscreen, setShowCardFullscreen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardRotated, setIsCardRotated] = useState(false);
  const [rotationStyle, setRotationStyle] = useState({ rotateX: 0, rotateY: 0 });
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [selectedCardForTrade, setSelectedCardForTrade] = useState<any>(null);
  const [salePrice, setSalePrice] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);

  const { toast } = useToast();

  // Queries pour les données utilisateur
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: collections = [], isLoading: collectionsLoading, refetch: refetchCollections } = useQuery({
    queryKey: ['/api/users/1/collections'],
    enabled: !!user,
  });

  const { data: personalCards = [], refetch: refetchPersonalCards } = useQuery({
    queryKey: ['/api/personal-cards'],
    enabled: !!user,
  });

  const { data: userDecks = [], refetch: refetchDecks } = useQuery({
    queryKey: ['/api/decks'],
    enabled: activeTab === "deck" && !!user,
  });

  useEffect(() => {
    if (activeTab === "deck") {
      refetchDecks();
    }
  }, [activeTab, refetchDecks]);

  // Ajouter une carte exemple si aucune carte personnelle n'existe
  const exampleCard = {
    id: 9999,
    playerName: "William Saliba",
    teamName: "Olympique de Marseille",
    imageUrl: goldCardsImage,
    isForTrade: true,
    tradePrice: 50,
    special: null,
    variant: "insert"
  };

  // Filtrer et rechercher les cartes personnelles avec carte exemple
  const cardsToShow = personalCards.length > 0 ? personalCards : [exampleCard];
  const filteredPersonalCards = cardsToShow.filter(card => {
    if (saleFilter === 'available') {
      if (!card.isForTrade || !card.tradePrice || card.isSold) return false;
    } else if (saleFilter === 'sold') {
      if (!card.isSold) return false;
    } 
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const playerMatch = card.playerName?.toLowerCase().includes(query);
      const teamMatch = card.teamName?.toLowerCase().includes(query);
      return playerMatch || teamMatch;
    }
    
    return true;
  });

  // Mutations pour les actions
  const deleteCardMutation = useMutation({
    mutationFn: (cardId: number) => apiRequest(`/api/personal-cards/${cardId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Carte supprimée avec succès",
        variant: "default",
      });
      refetchPersonalCards();
    },
    onError: () => {
      toast({
        title: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  });

  const updateSaleSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/personal-cards/${data.cardId}/sale-settings`, {
      method: 'PATCH',
      body: data
    }),
    onSuccess: () => {
      toast({
        title: "Paramètres de vente mis à jour",
        variant: "default",
      });
      refetchPersonalCards();
      handleCancelTrade();
    },
    onError: () => {
      toast({
        title: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  });

  const handleDeleteCard = (card: Card) => {
    deleteCardMutation.mutate(card.id);
  };

  const handleTradeCard = (card: any) => {
    setSelectedCardForTrade(card);
    setSalePrice(card.tradePrice || '');
    setSaleDescription(card.tradeDescription || '');
    setTradeOnly(!card.tradePrice);
    setShowTradePanel(true);
  };

  const handleSaveSaleSettings = () => {
    if (!selectedCardForTrade) return;

    const data = {
      cardId: selectedCardForTrade.id,
      isForTrade: true,
      tradePrice: tradeOnly ? null : parseFloat(salePrice) || null,
      tradeDescription: saleDescription.trim() || null
    };

    updateSaleSettingsMutation.mutate(data);
  };

  const handleCancelTrade = () => {
    setSelectedCardForTrade(null);
    setSalePrice('');
    setSaleDescription('');
    setTradeOnly(false);
    setShowTradePanel(false);
  };

  if (userLoading || collectionsLoading) {
    return <LoadingScreen />;
  }

  // Calculer les statistiques du profil
  const totalCards = personalCards.length;
  const totalDecks = userDecks.length;
  const totalFollowers = 1; // Remplacer par la vraie valeur depuis l'API

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      {/* Header exactement comme dans l'image */}
      <div className="relative px-4 py-4 flex items-center justify-between bg-[hsl(216,46%,13%)]">
        <div className="flex-1"></div>
        
        <div className="text-center">
          <h1 className="text-2xl font-['Luckiest_Guy'] text-white tracking-wide">
            BOOSTER<span className="text-[hsl(9,85%,67%)]">Z</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setLocation('/notifications')}
            className="w-11 h-11 rounded-full bg-[hsl(214,35%,20%)] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setLocation('/settings')}
            className="w-11 h-11 rounded-full bg-[hsl(214,35%,20%)] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profil utilisateur avec proportions exactes */}
      <div className="flex flex-col items-center pt-6 pb-8">
        {/* Avatar avec bordure jaune */}
        <div className="relative mb-4">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={`Avatar de ${user.name}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-lg">
              <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || user?.username?.charAt(0) || 'F'}</span>
            </div>
          )}
        </div>

        {/* Nom d'utilisateur en majuscules avec la bonne typo */}
        <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-wider font-['Inter']">
          {user?.name || 'FLORENT'}
        </h2>

        {/* Statistiques avec espacements corrects */}
        <div className="flex items-center space-x-12 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{totalCards}</div>
            <div className="text-sm text-gray-300 font-medium">cartes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalDecks}</div>
            <div className="text-sm text-gray-300 font-medium">decks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalFollowers}</div>
            <div className="text-sm text-gray-300 font-medium">abonnés</div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets avec design exact */}
      <div className="px-6 mb-6">
        <div className="bg-[hsl(214,35%,18%)] rounded-2xl p-1.5 flex shadow-lg">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 px-6 py-4 rounded-xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'cards'
                ? 'bg-[hsl(9,85%,67%)] text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-[hsl(214,35%,25%)]'
            }`}
          >
            <CardIcon className="w-5 h-5" />
            Cartes
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 px-6 py-4 rounded-xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'collections'
                ? 'bg-[hsl(9,85%,67%)] text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-[hsl(214,35%,25%)]'
            }`}
          >
            <Layers className="w-5 h-5" />
            Collections
          </button>
          <button
            onClick={() => setActiveTab('deck')}
            className={`flex-1 px-6 py-4 rounded-xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'deck'
                ? 'bg-[hsl(9,85%,67%)] text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-[hsl(214,35%,25%)]'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Decks
          </button>
        </div>
      </div>

      <main className="px-6 pb-24">
        {/* Contenu selon l'onglet actif */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            {/* En-tête avec titre et boutons - design amélioré */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Mes cartes</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="p-3 bg-[hsl(214,35%,18%)] hover:bg-[hsl(9,85%,67%)] rounded-xl transition-colors shadow-md"
                >
                  {viewMode === 'list' ? <List className="w-5 h-5 text-white" /> : <Grid className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-3 bg-[hsl(214,35%,18%)] hover:bg-[hsl(9,85%,67%)] rounded-xl transition-colors shadow-md"
                >
                  <LayoutGrid className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Barre de recherche avec design amélioré */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par joueur ou équipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[hsl(214,35%,18%)] border-2 border-transparent rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors shadow-lg"
              />
            </div>

            {/* Filtres avec design amélioré */}
            <div className="flex gap-3">
              <button
                onClick={() => setSaleFilter('all')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  saleFilter === 'all'
                    ? 'bg-[hsl(9,85%,67%)] text-white shadow-lg'
                    : 'bg-[hsl(214,35%,18%)] text-gray-300 hover:text-white hover:bg-[hsl(214,35%,25%)]'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setSaleFilter('available')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  saleFilter === 'available'
                    ? 'bg-[hsl(9,85%,67%)] text-white shadow-lg'
                    : 'bg-[hsl(214,35%,18%)] text-gray-300 hover:text-white hover:bg-[hsl(214,35%,25%)]'
                }`}
              >
                En vente
              </button>
              <button
                onClick={() => setSaleFilter('sold')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  saleFilter === 'sold'
                    ? 'bg-[hsl(9,85%,67%)] text-white shadow-lg'
                    : 'bg-[hsl(214,35%,18%)] text-gray-300 hover:text-white hover:bg-[hsl(214,35%,25%)]'
                }`}
              >
                Vendues
              </button>
              <button
                onClick={() => setLocation('/add-card')}
                className="ml-auto px-6 py-3 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white rounded-xl font-semibold transition-all duration-200 inline-flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Ajouter
              </button>
            </div>

            {/* Liste des cartes avec design exact de l'image */}
            <div className="space-y-4">
              {filteredPersonalCards.length > 0 ? (
                filteredPersonalCards.map((card) => (
                  <div key={card.id} className="bg-[hsl(214,35%,18%)] rounded-2xl p-5 shadow-lg border border-[hsl(214,35%,25%)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Image de la carte avec design exact */}
                        <div className="relative">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={`${card.playerName} - ${card.teamName}`}
                              className="w-16 h-20 object-cover rounded-xl border-3 border-yellow-400 shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl border-3 border-yellow-400 shadow-md flex items-center justify-center">
                              <span className="text-white text-xs font-bold">CARD</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Informations de la carte */}
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-1">{card.playerName}</h4>
                          <p className="text-gray-300 text-sm mb-2">{card.teamName}</p>
                          
                          {/* Badge spécial si nécessaire */}
                          {card.special && (
                            <span className="inline-block bg-yellow-500 text-black text-xs px-2 py-1 rounded-lg font-semibold mb-2">
                              {card.special}
                            </span>
                          )}
                          
                          {/* Indicateur "insert" comme dans l'image */}
                          <div className="text-xs text-gray-400 font-medium">
                            insert
                          </div>
                        </div>
                      </div>
                      
                      {/* Prix et actions */}
                      <div className="flex items-center space-x-4">
                        {/* Prix de vente comme dans l'image */}
                        {card.isForTrade && card.tradePrice && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">
                              $ {card.tradePrice}€
                            </div>
                          </div>
                        )}
                        
                        {/* Boutons d'action seulement pour les vraies cartes */}
                        {card.id !== 9999 && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTradeCard(card)}
                              className="p-3 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] rounded-xl transition-colors shadow-md"
                              title="Paramètres de vente"
                            >
                              <DollarSign className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card)}
                              className="p-3 bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md"
                              title="Supprimer la carte"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <Package className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-3">Aucune carte trouvée</h3>
                  <p className="text-gray-300 mb-6 text-lg">
                    {searchQuery || saleFilter !== 'all' 
                      ? 'Aucune carte ne correspond à vos critères.'
                      : 'Ajoutez des cartes à votre collection pour commencer.'
                    }
                  </p>
                  <button
                    onClick={() => setLocation('/add-card')}
                    className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-8 py-4 rounded-2xl font-bold transition-all duration-200 inline-flex items-center gap-3 shadow-lg text-lg"
                  >
                    <Plus className="w-6 h-6" />
                    Ajouter une carte
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Collections</h3>
            </div>

            {collections.length > 0 ? (
              collections.map((collection) => (
                <div key={collection.id} className="bg-[hsl(214,35%,18%)] rounded-2xl p-6 shadow-lg border border-[hsl(214,35%,25%)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{collection.name}</h4>
                      <p className="text-gray-300 text-base mb-3">{collection.description}</p>
                      <div className="text-base text-gray-200 font-medium">
                        {collection.ownedCards || 0} / {collection.totalCards || 0} cartes
                      </div>
                    </div>
                    <button
                      onClick={() => setLocation(`/collection/${collection.id}`)}
                      className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Layers className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Aucune collection</h3>
                <p className="text-gray-300 text-lg">Vos collections apparaîtront ici.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deck' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Mes Decks</h3>
              <button
                onClick={() => setLocation('/create-deck')}
                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 inline-flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Créer un deck
              </button>
            </div>

            {userDecks.length > 0 ? (
              <div className="space-y-4">
                {userDecks.map((deck) => (
                  <div key={deck.id} className="bg-[hsl(214,35%,18%)] rounded-2xl p-6 shadow-lg border border-[hsl(214,35%,25%)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">{deck.name}</h4>
                        <p className="text-gray-300 text-base">{deck.description || 'Aucune description'}</p>
                      </div>
                      <button
                        onClick={() => setLocation(`/deck/${deck.id}`)}
                        className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md"
                      >
                        Voir le deck
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Aucun deck</h3>
                <p className="text-gray-300 text-lg mb-6">Créez votre premier deck pour commencer.</p>
                <button
                  onClick={() => setLocation('/create-deck')}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-8 py-4 rounded-2xl font-bold transition-all duration-200 inline-flex items-center gap-3 shadow-lg text-lg"
                >
                  <Plus className="w-6 h-6" />
                  Créer un deck
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Panel de paramètres de vente */}
      {showTradePanel && selectedCardForTrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 max-w-md w-full border border-[hsl(214,35%,30%)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Paramètres de vente</h3>
              <button
                onClick={handleCancelTrade}
                className="w-8 h-8 bg-[hsl(214,35%,30%)] hover:bg-[hsl(214,35%,35%)] rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prix de vente (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  disabled={tradeOnly}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={saleDescription}
                  onChange={(e) => setSaleDescription(e.target.value)}
                  placeholder="Décrivez l'état de la carte..."
                  rows={3}
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
                onClick={handleCancelTrade}
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
      )}

      <Navigation />
    </div>
  );
}