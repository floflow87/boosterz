import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Filter, Camera, LayoutGrid, Layers, Trophy, Star, Zap, Award, Users, TrendingUp, Package, Trash2, AlertTriangle, CreditCard, FileText, CreditCard as CardIcon, MoreVertical, X, Edit, Eye, DollarSign, RefreshCw, Check } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import CardAddModal from "@/components/card-add-modal";
import CardDisplay from "../components/card-display";
import LoadingScreen from "@/components/LoadingScreen";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [activeTab, setActiveTab] = useState<"collections" | "cards" | "marketplace" | "deck">("collections");
  const [viewMode, setViewMode] = useState<"grid" | "gallery" | "carousel" | "list">("list");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);
  const [saleFilter, setSaleFilter] = useState<'all' | 'available' | 'sold'>('available');
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

  const handleDeleteCollection = (collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate(collectionToDelete.id);
    }
  };

  const handleTabChange = (tab: "collections" | "cards" | "marketplace" | "deck") => {
    setActiveTab(tab);
    if (tab === "collections") {
      setSelectedCollection(null);
    }
  };

  const handleSaveSaleSettings = () => {
    if (!selectedCard) return;
    
    // Here you would save the sale settings
    console.log("Saving sale settings:", {
      cardId: selectedCard.id,
      price: salePrice,
      description: saleDescription,
      tradeOnly: tradeOnly
    });
    
    setShowTradePanel(false);
    setSalePrice('');
    setSaleDescription('');
    setTradeOnly(false);
  };

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
            <h2 className="text-xl font-bold text-white mb-2">{user.name || user.username}</h2>
            <div className="flex items-center space-x-4 text-sm text-[hsl(212,23%,69%)]">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{user.totalCards || 0}</span>
                <span>cartes</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{user.collectionsCount || 0}</span>
                <span>collections</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{user.completionPercentage || 0}%</span>
                <span>complet</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 bg-[hsl(214,35%,22%)] rounded-xl p-1">
          <button
            onClick={() => handleTabChange("collections")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "collections" 
                ? "bg-[hsl(9,85%,67%)] text-white shadow-md transform scale-[1.02]" 
                : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
            style={activeTab === "collections" ? { backgroundColor: '#F37261' } : {}}
          >
            <Layers className="w-4 h-4" />
            Collections
          </button>
          <button
            onClick={() => handleTabChange("cards")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "cards" 
                ? "bg-[hsl(9,85%,67%)] text-white shadow-md transform scale-[1.02]" 
                : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Cartes
          </button>
          <button
            onClick={() => handleTabChange("marketplace")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "marketplace" 
                ? "bg-[hsl(9,85%,67%)] text-white shadow-md transform scale-[1.02]" 
                : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Ventes
          </button>
          <button
            onClick={() => handleTabChange("deck")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "deck" 
                ? "bg-[hsl(9,85%,67%)] text-white shadow-md transform scale-[1.02]" 
                : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
            }`}
          >
            <Package className="w-4 h-4" />
            Decks
          </button>
        </div>

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div>
            <style>{`
              .wallet-container {
                perspective: 1000px;
              }
              
              .collections-scroll {
                scrollbar-width: none;
                -ms-overflow-style: none;
                scroll-behavior: smooth;
                overflow-x: auto;
                overflow-y: hidden;
                -webkit-overflow-scrolling: touch;
              }
              
              .collections-scroll::-webkit-scrollbar {
                display: none;
              }
              
              .collections-swiper {
                overflow: visible;
                padding: 0 16px;
              }
              
              .collections-swiper .swiper-slide {
                height: auto;
              }
              
              .collections-swiper .swiper-pagination {
                position: static !important;
                bottom: auto !important;
                left: auto !important;
                transform: none !important;
                width: auto !important;
                margin-top: 20px;
                text-align: center;
              }
              
              .collections-swiper .swiper-pagination-bullet {
                background: rgba(255, 255, 255, 0.3) !important;
                opacity: 1 !important;
                width: 8px !important;
                height: 8px !important;
                margin: 0 4px !important;
              }
              
              .collections-swiper .swiper-pagination-bullet-active {
                background: hsl(9, 85%, 67%) !important;
                transform: scale(1.2) !important;
              }
              
              .collection-wallet-item {
                transform-style: preserve-3d;
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                min-width: 320px;
                max-width: 320px;
                flex-shrink: 0;
                width: 320px;
                scroll-snap-align: start;
              }
              
              .collection-wallet-item:hover {
                transform: translateY(-8px) rotateY(5deg) scale(1.02);
                box-shadow: 0 12px 40px rgba(243, 114, 97, 0.25);
              }
              
              .collection-wallet-item:nth-child(even):hover {
                transform: translateY(-8px) rotateY(-5deg) scale(1.02);
              }
              
              .wallet-card-display {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, hsl(216,46%,13%) 0%, hsl(214,35%,15%) 50%, hsl(214,35%,20%) 100%);
              }
              
              .wallet-card-stack {
                position: relative;
                transform-style: preserve-3d;
              }
              
              .wallet-card-layer {
                position: absolute;
                transition: all 0.3s ease;
                border-radius: 20px;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
              }
              
              .collection-wallet-item:hover .wallet-card-layer:nth-child(1) {
                transform: translateX(-8px) translateY(-4px) rotateZ(-3deg);
              }
              
              .collection-wallet-item:hover .wallet-card-layer:nth-child(2) {
                transform: translateX(0px) translateY(-2px) rotateZ(0deg);
              }
              
              .collection-wallet-item:hover .wallet-card-layer:nth-child(3) {
                transform: translateX(8px) translateY(-6px) rotateZ(3deg);
              }
              
              .collections-swiper {
                padding-bottom: 40px !important;
                overflow: visible !important;
              }
              
              .collections-swiper .swiper-wrapper {
                transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
              }
              
              .collections-swiper .swiper-slide {
                transition: transform 0.3s ease, opacity 0.3s ease !important;
              }
              
              .collections-swiper .swiper-pagination {
                bottom: 10px !important;
                position: absolute !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: auto !important;
                display: flex !important;
                justify-content: center !important;
                gap: 8px !important;
              }
              
              .collections-swiper .swiper-pagination-bullet {
                width: 8px !important;
                height: 8px !important;
                border-radius: 50% !important;
                background: rgba(255, 255, 255, 0.3) !important;
                opacity: 1 !important;
                margin: 0 !important;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
              }
              
              .collections-swiper .swiper-pagination-bullet-active {
                background: #F37261 !important;
                transform: scale(1.2) !important;
              }
              
              .collections-swiper .swiper-pagination-bullet-active-main {
                background: #F37261 !important;
                transform: scale(1.4) !important;
              }
            `}</style>
            
            <div className="collections-scroll">
              <Swiper
                slidesPerView="auto"
                spaceBetween={20}
                freeMode={{
                  enabled: true,
                  momentum: true,
                  momentumRatio: 0.85,
                  momentumBounce: true,
                  momentumBounceRatio: 0.1,
                  momentumVelocityRatio: 1.0,
                  sticky: true,
                  minimumVelocity: 0.02,
                }}
                resistance={true}
                resistanceRatio={0.15}
                speed={350}
                touchRatio={1.2}
                touchAngle={45}
                grabCursor={true}
                centeredSlides={false}
                slidesOffsetBefore={16}
                slidesOffsetAfter={16}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                  dynamicMainBullets: 3,
                  hideOnClick: false,
                  type: 'bullets'
                }}
                modules={[FreeMode, Pagination]}
                className="collections-swiper"
              >
                {collections?.map((collection) => {
                  const completion = getCollectionCompletion(collection);
                  return (
                    <SwiperSlide key={collection.id} className="!w-80">
                      <div 
                        onClick={() => {
                          setSelectedCollection(collection.id);
                          setActiveTab("cards");
                        }}
                        className="collection-wallet-item w-full bg-[hsl(214,35%,22%)] rounded-2xl overflow-hidden cursor-pointer group relative"
                      >
                        {/* Header with title and delete button */}
                        <div className="p-6 pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-white font-poppins text-xl">{collection.name}</h3>
                              <p className="text-white/60 text-base italic">{collection.season || 'Saison non spécifiée'}</p>
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
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card carousel area with wallet-style display */}
                        <div className="h-40 relative flex items-center justify-center overflow-hidden px-6 pb-3 wallet-card-display">
                          {/* Wallet-style card stack container */}
                          <div className="relative w-full max-w-md h-32 flex items-center justify-center wallet-card-stack">
                            {/* Background card layers for wallet effect */}
                            <div className="wallet-card-layer w-24 h-32 bg-white/10" style={{ zIndex: 1 }}></div>
                            <div className="wallet-card-layer w-24 h-32 bg-white/15" style={{ zIndex: 2 }}></div>
                            <div className="wallet-card-layer w-24 h-32 bg-white/20" style={{ zIndex: 3 }}></div>
                            
                            {/* Main card with golden cards image */}
                            <div className="relative w-32 h-32 bg-gradient-to-br from-[hsl(216,46%,13%)] via-[hsl(214,35%,15%)] to-[hsl(214,35%,20%)] rounded-2xl p-3 shadow-2xl flex items-center justify-center" style={{ zIndex: 4 }}>
                              <img 
                                src={goldenCardsIcon}
                                alt="Golden trading cards"
                                className="w-28 h-28 object-contain rounded-[20px] shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="px-6 pb-4">
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
                    </SwiperSlide>
                  );
                })}

                {/* Add Collection Button */}
                <SwiperSlide className="!w-80">
                  <div 
                    onClick={() => setShowAddModal(true)}
                    className="collection-wallet-item w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-8 flex flex-col items-center justify-center text-center h-full"
                  >
                    <div className="w-16 h-16 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2 font-poppins text-xl">Nouvelle Collection</h3>
                    <p className="text-[hsl(212,23%,69%)] text-base">Ajouter une collection à votre bibliothèque</p>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        )}

        {/* Cards Tab Content */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-poppins">
                {selectedCollection ? `Collection` : "Toutes mes cartes"}
              </h3>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
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
              </div>
            </div>
            
            {cards && cards.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {cards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      viewMode="grid"
                      showActions={true}
                      variant="detailed"
                      onCardClick={() => setSelectedCard(card)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      viewMode="list"
                      showActions={true}
                      variant="detailed"
                      onCardClick={() => setSelectedCard(card)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune carte trouvée</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  {selectedCollection 
                    ? "Cette collection ne contient pas encore de cartes. Ajoutez-en pour commencer votre collection."
                    : "Vous n'avez pas encore de cartes. Créez une collection et ajoutez vos premières cartes."
                  }
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Ajouter une carte
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
              
              {/* Filtres */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[hsl(214,35%,22%)] rounded-lg p-1">
                  <button
                    onClick={() => setSaleFilter('available')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'available' 
                        ? "bg-[hsl(9,85%,67%)] text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Disponibles
                  </button>
                  <button
                    onClick={() => setSaleFilter('sold')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'sold' 
                        ? "bg-[hsl(9,85%,67%)] text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Vendues
                  </button>
                  <button
                    onClick={() => setSaleFilter('all')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'all' 
                        ? "bg-[hsl(9,85%,67%)] text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Toutes
                  </button>
                </div>
              
              <div className="flex items-center gap-2">
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
                      showActions={true}
                      showTradeInfo={true}
                      variant="detailed"
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
                      showActions={true}
                      showTradeInfo={true}
                      variant="detailed"
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
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Decks</h3>
            
            <div className="text-center py-12">
              <div className="mb-6">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              </div>
              <div className="text-gray-400 mb-4 text-lg">
                Vous n'avez pas créé de deck.
              </div>
              <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Créez votre premier deck de cartes et montrez à votre communauté.
              </p>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
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
                    
                    {/* Trade Info */}
                    {selectedCard.isForTrade && (
                      <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4 space-y-2">
                        <div className="text-[hsl(9,85%,67%)] font-medium text-sm">
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
                    
                    <button 
                      onClick={() => {
                        setShowOptionsPanel(false);
                        setShowTradePanel(true);
                      }}
                      className="w-full p-4 text-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,67%)]/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-[hsl(9,85%,67%)] rounded-lg flex items-center justify-center">
                        <Edit className="w-4 h-4 text-white" />
                      </div>
                      Paramètres de vente
                    </button>
                    
                    <button className="w-full p-4 text-green-400 hover:bg-green-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      Marquer vendue
                    </button>
                    
                    <button className="w-full p-4 text-red-400 hover:bg-red-400/10 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                      Retirer de la vente
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
      
      <CardAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections || []}
        selectedCollection={selectedCollection ? collections?.find(c => c.id === selectedCollection) : undefined}
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
              Êtes-vous sûr de vouloir supprimer la collection "{collectionToDelete.name}" ? 
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