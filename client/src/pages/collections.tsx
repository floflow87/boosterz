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

  // Filtrer et rechercher les cartes personnelles
  const filteredPersonalCards = personalCards.filter(card => {
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
      {/* Header avec BOOSTERZ */}
      <div className="relative px-4 py-3 flex items-center justify-between bg-[hsl(214,35%,11%)] border-b border-[hsl(214,35%,30%)]">
        <div className="flex-1"></div>
        
        <div className="text-center">
          <h1 className="text-xl font-['Luckiest_Guy'] text-white tracking-wider">
            BOOSTER<span className="text-[hsl(9,85%,67%)]">Z</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setLocation('/notifications')}
            className="w-10 h-10 rounded-full bg-[hsl(214,35%,22%)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[hsl(214,35%,25%)] transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setLocation('/settings')}
            className="w-10 h-10 rounded-full bg-[hsl(214,35%,22%)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[hsl(214,35%,25%)] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profil utilisateur */}
      <div className="flex flex-col items-center pt-8 pb-6">
        {/* Avatar */}
        <div className="relative mb-4">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={`Avatar de ${user.name}`}
              className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-yellow-400">
              <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
            </div>
          )}
        </div>

        {/* Nom d'utilisateur */}
        <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-wider">
          {user?.name || user?.username || 'UTILISATEUR'}
        </h2>

        {/* Statistiques */}
        <div className="flex items-center space-x-8 text-center">
          <div>
            <div className="text-xl font-bold text-white">{totalCards}</div>
            <div className="text-sm text-gray-400">cartes</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalDecks}</div>
            <div className="text-sm text-gray-400">decks</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalFollowers}</div>
            <div className="text-sm text-gray-400">abonnés</div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="px-4 mb-6">
        <div className="bg-[hsl(214,35%,22%)] rounded-xl p-1 flex">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'cards'
                ? 'bg-[hsl(9,85%,67%)] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CardIcon className="w-4 h-4" />
            Cartes
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'collections'
                ? 'bg-[hsl(9,85%,67%)] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Collections
          </button>
          <button
            onClick={() => setActiveTab('deck')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'deck'
                ? 'bg-[hsl(9,85%,67%)] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Decks
          </button>
        </div>
      </div>

      <main className="px-4 pb-20">
        {/* Contenu selon l'onglet actif */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* En-tête avec titre et boutons */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Mes cartes</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="p-2 bg-[hsl(214,35%,22%)] hover:bg-[hsl(214,35%,25%)] rounded-lg transition-colors"
                >
                  {viewMode === 'list' ? <List className="w-4 h-4 text-white" /> : <Grid className="w-4 h-4 text-white" />}
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 bg-[hsl(214,35%,22%)] hover:bg-[hsl(214,35%,25%)] rounded-lg transition-colors"
                >
                  <LayoutGrid className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par joueur ou équipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSaleFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saleFilter === 'all'
                    ? 'bg-[hsl(9,85%,67%)] text-white'
                    : 'bg-[hsl(214,35%,22%)] text-gray-400 hover:text-white'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setSaleFilter('available')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saleFilter === 'available'
                    ? 'bg-[hsl(9,85%,67%)] text-white'
                    : 'bg-[hsl(214,35%,22%)] text-gray-400 hover:text-white'
                }`}
              >
                En vente
              </button>
              <button
                onClick={() => setSaleFilter('sold')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saleFilter === 'sold'
                    ? 'bg-[hsl(9,85%,67%)] text-white'
                    : 'bg-[hsl(214,35%,22%)] text-gray-400 hover:text-white'
                }`}
              >
                Vendues
              </button>
              <button
                onClick={() => setLocation('/add-card')}
                className="ml-auto px-4 py-2 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* Liste des cartes */}
            <div className="space-y-3">
              {filteredPersonalCards.length > 0 ? (
                filteredPersonalCards.map((card) => (
                  <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-xl p-4 border border-[hsl(214,35%,30%)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {card.imageUrl && (
                          <img
                            src={card.imageUrl}
                            alt={`${card.playerName} - ${card.teamName}`}
                            className="w-12 h-16 object-cover rounded border-2 border-yellow-400"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-white">{card.playerName}</h4>
                          <p className="text-gray-400 text-sm">{card.teamName}</p>
                          {card.isForTrade && (
                            <div className="flex items-center gap-1 mt-1">
                              <DollarSign className="w-3 h-3 text-[hsl(9,85%,67%)]" />
                              <span className="text-[hsl(9,85%,67%)] text-sm font-medium">
                                {card.tradePrice ? `${card.tradePrice}€` : 'Échange uniquement'}
                              </span>
                            </div>
                          )}
                          {card.special && (
                            <span className="inline-block bg-yellow-600 text-white text-xs px-2 py-1 rounded mt-1">
                              {card.special}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTradeCard(card)}
                          className="p-2 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] rounded-lg transition-colors"
                          title="Paramètres de vente"
                        >
                          <DollarSign className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          title="Supprimer la carte"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Aucune carte trouvée</h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery || saleFilter !== 'all' 
                      ? 'Aucune carte ne correspond à vos critères.'
                      : 'Ajoutez des cartes à votre collection pour commencer.'
                    }
                  </p>
                  <button
                    onClick={() => setLocation('/add-card')}
                    className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une carte
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Collections</h3>
            </div>

            {collections.length > 0 ? (
              collections.map((collection) => (
                <div key={collection.id} className="bg-[hsl(214,35%,22%)] rounded-xl p-4 border border-[hsl(214,35%,30%)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{collection.name}</h4>
                      <p className="text-gray-400 text-sm mb-2">{collection.description}</p>
                      <div className="text-sm text-gray-300">
                        {collection.ownedCards || 0} / {collection.totalCards || 0} cartes
                      </div>
                    </div>
                    <button
                      onClick={() => setLocation(`/collection/${collection.id}`)}
                      className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune collection</h3>
                <p className="text-gray-400">Vos collections apparaîtront ici.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deck' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Mes Decks</h3>
              <button
                onClick={() => setLocation('/create-deck')}
                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer un deck
              </button>
            </div>

            {userDecks.length > 0 ? (
              <div className="space-y-3">
                {userDecks.map((deck) => (
                  <div key={deck.id} className="bg-[hsl(214,35%,22%)] rounded-xl p-4 border border-[hsl(214,35%,30%)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{deck.name}</h4>
                        <p className="text-gray-400 text-sm">{deck.description || 'Aucune description'}</p>
                      </div>
                      <button
                        onClick={() => setLocation(`/deck/${deck.id}`)}
                        className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Voir le deck
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucun deck</h3>
                <p className="text-gray-400 mb-4">Créez votre premier deck pour commencer.</p>
                <button
                  onClick={() => setLocation('/create-deck')}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
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