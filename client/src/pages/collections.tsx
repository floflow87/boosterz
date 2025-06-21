import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Grid, List, Search, Filter, MoreHorizontal, AlertTriangle, TrendingUp, X, Settings, Star, DollarSign, ArrowUpDown, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import HaloBlur from "../components/halo-blur";
import Header from "../components/header";
import CardDisplay from "../components/card-display";
import Navigation from "../components/navigation";
import { Collection, Card, User } from "../../../shared/schema";
import CardAddModal from "../components/card-add-modal";
import { useToast } from "../hooks/use-toast";

export default function Collections() {
  const [activeTab, setActiveTab] = useState<"collections" | "marketplace" | "deck">("collections");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });

  const { data: marketplaceCards, isLoading: marketplaceLoading } = useQuery<Card[]>({
    queryKey: ['/api/cards/marketplace'],
  });

  const filteredCollections = collections?.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCollectionCompletion = (collection: Collection) => {
    return { owned: 0, total: 0, percentage: 0 };
  };

  const handleDeleteCollection = (collection: Collection, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!collectionToDelete) return;

    try {
      const response = await fetch(`/api/collections/${collectionToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setShowDeleteModal(false);
      setCollectionToDelete(null);
      
      toast({
        title: "Collection supprimée",
        description: "La collection a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la collection.",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setShowOptionsPanel(true);
  };

  const handleTradeClick = (card: Card) => {
    setSelectedCard(card);
    setShowOptionsPanel(false);
    setShowTradePanel(true);
    setSalePrice(card.salePrice || '');
    setSaleDescription(card.saleDescription || '');
    setTradeOnly(card.tradeOnly || false);
  };

  const handleToggleFeatured = async (cardId: number) => {
    try {
      const response = await fetch(`/api/cards/${cardId}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/cards/marketplace'] });
      
      toast({
        title: "Carte mise à jour",
        description: "Le statut de mise en avant a été modifié.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la carte.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSaleSettings = async () => {
    if (!selectedCard) return;

    try {
      const response = await fetch(`/api/cards/${selectedCard.id}/sale-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salePrice,
          saleDescription,
          tradeOnly,
          isForTrade: true
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
      
      setShowTradePanel(false);
      setSalePrice('');
      setSaleDescription('');
      setTradeOnly(false);
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de vente ont été mis à jour.",
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/cards/marketplace'] });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsSold = async (cardId: number) => {
    try {
      const response = await fetch(`/api/cards/${cardId}/sold`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSold: true }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/cards/marketplace'] });
      
      toast({
        title: "Carte marquée vendue",
        description: "La carte a été marquée comme vendue.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme vendue.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title="Collections" />
      <main className="relative z-10 px-4 pb-24">
        {/* User Profile Section */}
        {user && (
          <div className="flex flex-col items-center text-center mb-4 mt-2">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3 shadow-lg relative">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <h2 className="text-white text-xl font-semibold font-poppins">{user.name}</h2>
            <p className="text-[hsl(212,23%,69%)] text-sm">@{user.username}</p>
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="flex bg-[hsl(214,35%,22%)] rounded-2xl p-1 mb-6 border border-[hsl(214,35%,30%)]">
          <button
            onClick={() => setActiveTab("collections")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === "collections"
                ? "bg-[hsl(9,85%,67%)] text-white shadow-lg"
                : "text-[hsl(212,23%,69%)] hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === "marketplace"
                ? "bg-[hsl(9,85%,67%)] text-white shadow-lg"
                : "text-[hsl(212,23%,69%)] hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab("deck")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === "deck"
                ? "bg-[hsl(9,85%,67%)] text-white shadow-lg"
                : "text-[hsl(212,23%,69%)] hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
          >
            Mon Deck
          </button>
        </div>

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            {/* Search and Actions Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(212,23%,69%)] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-xl text-white placeholder-[hsl(212,23%,69%)] focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`p-3 rounded-xl border transition-colors ${
                  showFilter
                    ? "bg-[hsl(9,85%,67%)] border-[hsl(9,85%,67%)] text-white"
                    : "bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-[hsl(212,23%,69%)] hover:text-white hover:border-[hsl(9,85%,67%)]"
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-3 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white rounded-xl transition-colors border border-[hsl(9,85%,67%)]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-poppins">Mes Collections</h3>
              <div className="flex items-center gap-2 bg-[hsl(214,35%,22%)] rounded-lg p-1 border border-[hsl(214,35%,30%)]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-[hsl(9,85%,67%)] text-white"
                      : "text-[hsl(212,23%,69%)] hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-[hsl(9,85%,67%)] text-white"
                      : "text-[hsl(212,23%,69%)] hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collections Grid/List */}
            {collectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-[hsl(214,35%,30%)] rounded mb-4"></div>
                    <div className="h-4 bg-[hsl(214,35%,30%)] rounded mb-2"></div>
                    <div className="h-4 bg-[hsl(214,35%,30%)] rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredCollections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCollections.map((collection) => {
                  const completion = getCollectionCompletion(collection);
                  return (
                    <Link key={collection.id} href={`/collection/${collection.id}`}>
                      <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 border border-[hsl(214,35%,30%)] hover:border-[hsl(9,85%,67%)] transition-all cursor-pointer group relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-white font-poppins group-hover:text-[hsl(9,85%,67%)] transition-colors">
                              {collection.name}
                            </h3>
                            <button
                              onClick={(e) => handleDeleteCollection(collection, e)}
                              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500 rounded-lg transition-all"
                            >
                              <MoreHorizontal className="w-4 h-4 text-[hsl(212,23%,69%)]" />
                            </button>
                          </div>
                          <p className="text-[hsl(212,23%,69%)] text-sm mb-4 line-clamp-2">
                            {collection.description || "Aucune description"}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[hsl(212,23%,69%)]">Progression</span>
                              <span className="text-white font-medium">{completion.owned}/{completion.total}</span>
                            </div>
                            <div className="w-full bg-[hsl(214,35%,30%)] rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[hsl(9,85%,67%)] to-yellow-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${completion.percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-[hsl(212,23%,69%)]">
                              {completion.percentage}% complété
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(9,85%,67%)]/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2 text-lg">Aucune collection trouvée</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? "Aucune collection ne correspond à votre recherche. Essayez avec d'autres mots-clés."
                    : "Commencez votre aventure en créant votre première collection de cartes."
                  }
                </p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Créer une collection
                </button>
              </div>
            )}
          </div>
        )}

        {/* Marketplace Tab Content */}
        {activeTab === "marketplace" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-poppins">Mes cartes à la vente</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-[hsl(9,85%,67%)] text-white"
                      : "text-[hsl(212,23%,69%)] hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-[hsl(9,85%,67%)] text-white"
                      : "text-[hsl(212,23%,69%)] hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
            
            {marketplaceCards && marketplaceCards.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {marketplaceCards
                    .filter(card => {
                      if (saleFilter === 'available') return card.isForTrade && !card.isSold;
                      if (saleFilter === 'sold') return card.isSold;
                      return card.isForTrade || card.isSold;
                    })
                    .map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      viewMode="grid"
                      showTradeInfo={true}
                      context="sale"
                      onCardClick={() => setSelectedCard(card)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {marketplaceCards
                    .filter(card => {
                      if (saleFilter === 'available') return card.isForTrade && !card.isSold;
                      if (saleFilter === 'sold') return card.isSold;
                      return card.isForTrade || card.isSold;
                    })
                    .map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      viewMode="list"
                      showTradeInfo={true}
                      context="sale"
                      onCardClick={() => setSelectedCard(card)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune carte en vente</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Mettez vos cartes en vente depuis vos collections pour commencer à trader avec la communauté.
                </p>
                <button 
                  onClick={() => setActiveTab("collections")}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Voir mes collections
                </button>
              </div>
            )}
          </div>
        )}

        {/* Deck Tab Content */}
        {activeTab === "deck" && (
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2 text-lg">Fonctionnalité à venir</div>
              <p className="text-[hsl(212,23%,69%)] text-sm">
                La gestion des decks sera bientôt disponible.
              </p>
            </div>
          </div>
        )}

        {/* Options Panel */}
        {showOptionsPanel && selectedCard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="bg-[hsl(214,35%,22%)] rounded-t-3xl p-6 w-full max-w-md border-t border-[hsl(214,35%,30%)] animate-slide-up">
              <div className="w-8 h-1 bg-gray-400 rounded-full mx-auto mb-6"></div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">{selectedCard.playerName}</h3>
                <p className="text-[hsl(212,23%,69%)] text-sm">{selectedCard.reference}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleTradeClick(selectedCard)}
                  className="w-full flex items-center gap-3 p-4 bg-[hsl(214,35%,30%)] hover:bg-[hsl(214,35%,35%)] rounded-xl transition-colors"
                >
                  <Settings className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <span className="text-white font-medium">Paramètres de vente</span>
                </button>
                
                <button
                  onClick={() => handleToggleFeatured(selectedCard.id)}
                  className="w-full flex items-center gap-3 p-4 bg-[hsl(214,35%,30%)] hover:bg-[hsl(214,35%,35%)] rounded-xl transition-colors"
                >
                  <Star className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <span className="text-white font-medium">
                    {selectedCard.isFeatured ? 'Retirer de la une' : 'Mettre à la une'}
                  </span>
                </button>

                <button
                  onClick={() => handleMarkAsSold(selectedCard.id)}
                  className="w-full flex items-center gap-3 p-4 bg-[hsl(214,35%,30%)] hover:bg-[hsl(214,35%,35%)] rounded-xl transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-white font-medium">Marquer comme vendue</span>
                </button>
              </div>

              <button
                onClick={() => setShowOptionsPanel(false)}
                className="w-full mt-6 p-4 text-[hsl(212,23%,69%)] hover:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Trade Panel */}
        {showTradePanel && selectedCard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="bg-[hsl(214,35%,22%)] rounded-t-3xl p-6 w-full max-w-md border-t border-[hsl(214,35%,30%)] animate-slide-up max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Paramètres de vente</h3>
                <button
                  onClick={() => setShowTradePanel(false)}
                  className="p-2 hover:bg-[hsl(214,35%,30%)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[hsl(212,23%,69%)]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Prix de vente (€)</label>
                  <input
                    type="text"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg text-white placeholder-[hsl(212,23%,69%)] focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)]"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Description</label>
                  <textarea
                    value={saleDescription}
                    onChange={(e) => setSaleDescription(e.target.value)}
                    placeholder="Description de la carte, état, etc..."
                    rows={3}
                    className="w-full p-3 bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg text-white placeholder-[hsl(212,23%,69%)] focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[hsl(214,35%,30%)] rounded-lg">
                  <div>
                    <div className="text-white font-medium">Échange uniquement</div>
                    <div className="text-[hsl(212,23%,69%)] text-sm">Masquer le prix public</div>
                  </div>
                  <button
                    onClick={() => setTradeOnly(!tradeOnly)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      tradeOnly ? 'bg-[hsl(9,85%,67%)]' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      tradeOnly ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
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
      </main>
      
      <CardAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections || []}
        selectedCollection={selectedCollection || undefined}
      />
      
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
              Êtes-vous sûr de vouloir supprimer "{collectionToDelete.name}" ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      <Navigation />
    </div>
  );
}