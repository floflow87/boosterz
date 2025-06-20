import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Filter, Camera, LayoutGrid, Layers, Trophy, Star, Zap, Award, Users, TrendingUp, Package, Trash2, AlertTriangle, CreditCard, FileText, CreditCard as CardIcon } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import CardAddModal from "@/components/card-add-modal";
import LoadingScreen from "@/components/LoadingScreen";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import avatarImage from "@assets/image_1750196240581.png";
import cardStackIcon from "@assets/image_1750351528484.png";
import goldCardsImage from "@assets/2ba6c853-16ca-4c95-a080-c551c3715411_1750361216149.png";
import goldenCardsIcon from "@assets/2ba6c853-16ca-4c95-a080-c551c3715411_1750366562526.png";
import type { User, Collection, Card } from "@shared/schema";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"collections" | "cards" | "marketplace">("collections");
  const [viewMode, setViewMode] = useState<"grid" | "gallery" | "carousel">("grid");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
  const [showFilters, setShowFilters] = useState(false);
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

  const { data: cards } = useQuery<Card[]>({
    queryKey: selectedCollection ? [`/api/collections/${selectedCollection}/cards`] : ["/api/cards/all"],
    enabled: !!selectedCollection && activeTab === "cards",
  });

  const { data: marketplaceCards } = useQuery<Card[]>({
    queryKey: ["/api/cards/marketplace"],
    enabled: activeTab === "marketplace",
    staleTime: 1 * 60 * 1000, // 1 minute
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

  const handleCollectionClick = (collectionId: number) => {
    if (activeTab === "collections") {
      setLocation(`/collection/${collectionId}`);
    } else {
      setSelectedCollection(collectionId);
    }
  };

  const handleDeleteCollection = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Protéger la collection Score Ligue 1 2023/24
    if (collection.id === 1 || collection.name?.includes("SCORE LIGUE 1")) {
      toast({
        title: "Action non autorisée",
        description: "La collection Score Ligue 1 2023/24 ne peut pas être supprimée.",
        variant: "destructive"
      });
      return;
    }
    
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate(collectionToDelete.id);
    }
  };

  // Filter collections based on search and status
  const filteredCollections = collections?.filter(collection => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        collection.name?.toLowerCase().includes(query) ||
        collection.season?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus === "completed" && collection.completionPercentage !== 100) return false;
    if (filterStatus === "incomplete" && collection.completionPercentage === 100) return false;

    return true;
  });

  if (userLoading || collectionsLoading) {
    return <LoadingScreen />;
  }

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
            <h2 className="text-xl font-bold text-white font-luckiest tracking-wide">{user.name}</h2>
            <p className="text-[hsl(212,23%,69%)] text-sm font-poppins mb-3">@{user.username}</p>
            
            <div className="flex space-x-4 text-center justify-center max-w-80 mx-auto">
              <div className="bg-[hsl(214,35%,22%)] p-3 rounded-lg border border-[hsl(9,85%,67%)]/30 flex-1 ml-[0px] mr-[0px] pl-[24px] pr-[24px]">
                <CreditCard className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{collections?.reduce((total, collection) => total + (collection.ownedCards || 0), 0) || 0}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Cartes</div>
              </div>
              <div className="bg-[hsl(214,35%,22%)] p-3 rounded-lg border border-[hsl(9,85%,67%)]/30 flex-1">
                <Trophy className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{collections?.length || 0}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Collections</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-50 pb-3 mb-3 bg-[hsl(216,46%,13%)] pt-2 -mx-4 px-4" style={{ height: '58px' }}>
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide min-h-[44px] items-center px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button 
              onClick={() => setActiveTab("cards")}
              className={`px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "cards" 
                  ? "text-white shadow-lg transform scale-105" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              style={activeTab === "cards" ? { backgroundColor: '#F37261' } : {}}
            >
              <Star className="w-3 h-3 mr-1 inline" />
              Toutes les cartes
            </button>
            <button 
              onClick={() => setActiveTab("collections")}
              className={`px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "collections" 
                  ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Users className="w-3 h-3 mr-1 inline" />
              Collections
            </button>
            <button 
              onClick={() => setActiveTab("marketplace")}
              className={`px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "marketplace" 
                  ? "bg-purple-600 text-white shadow-lg transform scale-105" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1 inline" />
              Marketplace
            </button>
          </div>
        </div>

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div>
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("gallery")}
                  className={`p-2 rounded-lg ${
                    viewMode === "gallery" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("carousel")}
                  className={`p-2 rounded-lg ${
                    viewMode === "carousel" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-2 rounded-lg ${
                    showSearch ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg ${
                    showFilters ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Rechercher par nom de collection ou saison..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[hsl(214,35%,22%)] text-white rounded-lg p-3 border border-gray-600 font-poppins placeholder-gray-400"
                />
              </div>
            )}

            {/* Filter Controls */}
            {showFilters && (
              <div className="mb-4 p-4 bg-[hsl(214,35%,22%)] rounded-lg">
                <h4 className="text-white font-semibold mb-3 font-poppins">Filtres</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[hsl(212,23%,69%)] text-sm font-poppins">Statut de completion</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as "all" | "completed" | "incomplete")}
                      className="w-full mt-1 bg-[hsl(216,46%,13%)] text-white rounded-lg p-2 border border-gray-600 font-poppins"
                    >
                      <option value="all">Toutes les collections</option>
                      <option value="completed">Collections complètes</option>
                      <option value="incomplete">Collections incomplètes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Collections Grid */}
            <div className="collection-grid mb-6">
              {filteredCollections?.map((collection) => (
                <div 
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="card-clickable bg-[hsl(214,35%,22%)] rounded-xl p-4 card-hover cursor-pointer group"
                >
                  <div className="bg-[hsl(9,85%,67%)] rounded-lg p-3 mb-3 text-center relative">
                    <h3 className="font-bold text-white text-sm font-luckiest">{collection.name}</h3>
                    <p className="text-xs text-white opacity-90 font-poppins">{collection.season}</p>
                    {!collection.name?.includes("SCORE LIGUE 1") && (
                      <button
                        onClick={(e) => handleDeleteCollection(collection, e)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 text-xs"
                        title="Supprimer la collection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <img 
                    src={goldCardsImage} 
                    alt="Trading cards"
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                  <div className="text-xs text-[hsl(212,23%,69%)] font-poppins">
                    {collection.ownedCards}/{collection.totalCards} cartes
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div 
                      className="progress-bar h-1.5 rounded-full" 
                      style={{ width: `${collection.completionPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards Tab Content */}
        {activeTab === "cards" && (
          <div>
            <p className="text-center text-white">Contenu de l'onglet cartes à implémenter</p>
          </div>
        )}

        {/* Marketplace Tab Content */}
        {activeTab === "marketplace" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Cartes à la vente</h3>
            
            {marketplaceCards && marketplaceCards.length > 0 ? (
              <div className="space-y-4">
                {marketplaceCards.map((card) => (
                  <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-20 bg-gray-600 rounded flex-shrink-0">
                        {card.imageUrl && (
                          <img 
                            src={card.imageUrl} 
                            alt={`${card.playerName} card`}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{card.playerName}</div>
                        <div className="text-[hsl(212,23%,69%)] text-sm">{card.reference}</div>
                        <div className="text-[hsl(9,85%,67%)] text-sm font-semibold">
                          {card.tradePrice ? `${card.tradePrice}€` : "Prix à négocier"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">Aucune carte en vente</div>
                <p className="text-[hsl(212,23%,69%)] text-sm">
                  Utilisez le panneau d'échange sur vos cartes pour les mettre en vente
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation />

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
            <h3 className="text-lg font-bold text-white text-center mb-2">Supprimer la collection</h3>
            <p className="text-[hsl(212,23%,69%)] text-center mb-6">
              Êtes-vous sûr de vouloir supprimer la collection "{collectionToDelete.name}" ? Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-[hsl(214,35%,30%)] text-white rounded-lg py-2 px-4 hover:bg-[hsl(214,35%,35%)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteCollection}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}