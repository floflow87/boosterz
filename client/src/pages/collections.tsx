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
  const [activeTab, setActiveTab] = useState<"collections" | "cards" | "marketplace" | "deck">("cards");
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

  // Récupération de l'utilisateur authentifié
  const { data: authUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const userId = authUser?.user?.id || 1;

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: [`/api/users/${userId}/collections`],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: personalCards, isLoading: personalCardsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/personal-cards`],
    staleTime: 5 * 60 * 1000,
  });

  const { data: userDecks, isLoading: decksLoading } = useQuery({
    queryKey: [`/api/users/${userId}/decks`],
    staleTime: 5 * 60 * 1000,
  });

  const { data: cards } = useQuery({
    queryKey: selectedCollection ? [`/api/collections/${selectedCollection}/cards`] : ["/api/cards/all"],
    enabled: !!selectedCollection && activeTab === "cards",
  });

  const getCollectionCompletion = (collection: Collection) => {
    // Utiliser d'abord les données de la collection si disponibles
    if (collection.totalCards && collection.ownedCards !== undefined) {
      return {
        totalCards: collection.totalCards,
        ownedCards: collection.ownedCards,
        percentage: Math.round((collection.ownedCards / collection.totalCards) * 100)
      };
    }
    
    // Sinon calculer depuis les cartes personnelles
    if (!personalCards || !Array.isArray(personalCards)) {
      return { totalCards: 2853, ownedCards: 0, percentage: 0 };
    }
    
    const ownedCards = personalCards.filter((card: any) => 
      card.collectionId === collection.id && !card.isSold
    ).length;
    
    return {
      ownedCards,
      totalCards: collection.totalCards || 2853,
      percentage: Math.round((ownedCards / (collection.totalCards || 2853)) * 100)
    };
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
            <h2 className="text-xl font-bold text-white font-luckiest tracking-wide">{user.name}</h2>
            <p className="text-[hsl(212,23%,69%)] text-sm font-poppins mb-3">@{user.username}</p>
            
            <div className="flex space-x-4 text-center justify-center max-w-80 mx-auto">
              <div className="bg-[hsl(214,35%,22%)] p-3 rounded-lg flex-1 ml-[0px] mr-[0px] pl-[24px] pr-[24px]">
                <CreditCard className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {(Array.isArray(personalCards) ? personalCards.filter((card: any) => !card.isSold).length : 0)}
                </div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Cartes</div>
              </div>
              <div className="bg-[hsl(214,35%,22%)] p-3 rounded-lg flex-1">
                <Trophy className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{(Array.isArray(collections) ? collections.length : 0)}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Collections</div>
              </div>
              <div className="bg-[hsl(214,35%,22%)] p-3 rounded-lg flex-1">
                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{user?.followersCount || 0}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Abonnés</div>
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
              Cartes ajoutées
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
              onClick={() => setActiveTab("deck")}
              className={`px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "deck" 
                  ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1 inline" />
              Decks
            </button>
          </div>
        </div>

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Collections</h3>
            
            {/* Score Ligue 1 Collection */}
            <div 
              onClick={() => setLocation("/collection/1")}
              className="bg-[hsl(214,35%,22%)] rounded-xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-[hsl(9,85%,67%)]/50 relative group"
            >
              <div className="bg-[hsl(9,85%,67%)] rounded-lg p-3 mb-3 text-center relative">
                <img 
                  src="/attached_assets/image%2029_1750232088999.png" 
                  alt="Score Ligue 1 logo"
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
                <h3 className="font-bold text-white text-xs font-luckiest">SCORE LIGUE 1</h3>
                <p className="text-xs text-white opacity-90 font-poppins">23/24</p>
              </div>
              
              <div className="text-center mb-3">
                <div className="text-xs text-gray-300 mb-1">
                  <span className="text-[hsl(9,85%,67%)] font-bold">{(Array.isArray(personalCards) ? personalCards.filter((card: any) => !card.isSold).length : 0)}</span> / 2853 cartes
                </div>
                <div className="text-xs text-gray-300">
                  {((Array.isArray(personalCards) ? personalCards.filter((card: any) => !card.isSold).length : 0) / 2853 * 100).toFixed(1)}% complété
                </div>
              </div>
              
              <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                <div 
                  className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((Array.isArray(personalCards) ? personalCards.filter((card: any) => !card.isSold).length : 0) / 2853 * 100)}%` }}
                />
              </div>
            </div>

            {/* Autres collections si elles existent */}
            {collections && collections.length > 0 && collections.map((collection) => {
              const completion = getCollectionCompletion(collection);
              return (
                <div key={collection.id}>
                  <div 
                    onClick={() => setLocation(`/collection/${collection.id}`)}
                    className="w-full bg-gradient-radial from-[hsl(214,35%,22%)] from-0% to-[hsl(216,46%,13%)] to-100% rounded-2xl overflow-hidden cursor-pointer group relative transform transition-all duration-300 hover:scale-[1.02] border-2 border-yellow-500/50 hover:border-yellow-400/70"
                  >
                    {/* Header avec titre et bouton supprimer */}
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
                                setCollectionToDelete(collection);
                                setShowDeleteModal(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 text-xs"
                              title="Supprimer la collection"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-white/80">
                          {completion.ownedCards} / {completion.totalCards} cartes
                        </span>
                        <span className="text-sm font-medium text-[hsl(9,85%,67%)]">
                          {completion.percentage}%
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2 mt-2">
                        <div 
                          className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completion.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Collection Button */}
            <div 
              onClick={() => setLocation("/add-card")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-base">Ajouter une carte</h3>
              <p className="text-sm text-gray-300 font-poppins">Glissez une photo ou ajoutez manuellement</p>
            </div>
          </div>
        )}

        {/* Cards Tab Content */}
        {activeTab === "cards" && (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("carousel")}
                  className={`p-2 rounded-lg ${
                    viewMode === "carousel" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("gallery")}
                  className={`p-2 rounded-lg ${
                    viewMode === "gallery" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 bg-[hsl(214,35%,22%)] rounded-lg">
                  <Search className="w-4 h-4 text-[hsl(212,23%,69%)]" />
                </button>
                <button className="p-2 bg-[hsl(214,35%,22%)] rounded-lg">
                  <Filter className="w-4 h-4 text-[hsl(212,23%,69%)]" />
                </button>
              </div>
            </div>

            {/* Collection Selector */}
            <div className="mb-4">
              <select
                value={selectedCollection || ""}
                onChange={(e) => setSelectedCollection(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-[hsl(214,35%,22%)] text-white rounded-lg p-3 border border-gray-600 font-poppins"
              >
                <option value="">Toutes les collections</option>
                {collections?.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({getCollectionCompletion(collection).ownedCards}/{getCollectionCompletion(collection).totalCards})
                  </option>
                ))}
              </select>
            </div>

            {/* Collections Grid */}
            {!selectedCollection && (
              <div className="collection-grid mb-6">
                {collections?.map((collection) => {
                  const completion = getCollectionCompletion(collection);
                  return (
                    <div 
                      key={collection.id}
                      onClick={() => setSelectedCollection(collection.id)}
                      className="bg-[hsl(214,35%,22%)] rounded-xl p-4 card-hover cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-[hsl(9,85%,67%)]/50 relative group"
                    >
                      <div className="bg-[hsl(9,85%,67%)] rounded-lg p-3 mb-3 text-center relative">
                        {collection.name === 'SCORE LIGUE 1' ? (
                          <>
                            <img 
                              src="/attached_assets/image%2029_1750232088999.png" 
                              alt="Score Ligue 1 logo"
                              className="w-16 h-16 object-contain mx-auto mb-2"
                            />
                            <h3 className="font-bold text-white text-xs font-luckiest">{collection.name}</h3>
                            <p className="text-xs text-white opacity-90 font-poppins">{collection.season}</p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-bold text-white text-sm font-luckiest">{collection.name}</h3>
                            <p className="text-xs text-white opacity-90 font-poppins">{collection.season}</p>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-[hsl(212,23%,69%)] font-poppins">
                        {completion.ownedCards} cartes possédées
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                        <div 
                          className="progress-bar h-1.5 rounded-full bg-[hsl(9,85%,67%)]" 
                          style={{ width: `${completion.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-[hsl(9,85%,67%)] font-poppins mt-1">
                        {completion.percentage}% complété
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Personal Cards Display when no collection selected */}
            {!selectedCollection && personalCards && personalCards.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white font-poppins">Mes Cartes Personnelles</h3>
                <div className="grid grid-cols-2 gap-4">
                  {personalCards.filter((card: any) => !card.isSold).map((card: any) => (
                    <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-3">
                      <h4 className="font-bold text-white text-sm">{card.playerName}</h4>
                      <p className="text-gray-300 text-xs">{card.teamName}</p>
                      {card.tradePrice && (
                        <p className="text-green-400 text-xs mt-1">{card.tradePrice}€</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Decks Tab Content */}
        {activeTab === "deck" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Decks</h3>
            
            {decksLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(9,85%,67%)] mx-auto"></div>
              </div>
            ) : userDecks && userDecks.length > 0 ? (
              <div className="space-y-4">
                {userDecks.map((deck: any) => (
                  <div 
                    key={deck.id} 
                    onClick={() => setLocation(`/deck/${deck.id}`)}
                    className="bg-[hsl(214,35%,22%)] rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <h4 className="font-bold text-white text-lg">{deck.name}</h4>
                    <p className="text-gray-300 text-sm">{deck.cardCount || 0}/12 cartes</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucun deck</div>
                <p className="text-[hsl(212,23%,69%)] text-sm">Créez votre premier deck pour organiser vos cartes.</p>
              </div>
            )}
          </div>
        )}

        {/* Floating Add Button */}
        {(activeTab === "cards" || activeTab === "collections") && (
          <button
            onClick={() => setLocation("/add-card")}
            className="fixed bottom-20 right-4 w-10 h-10 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] active:bg-[hsl(9,85%,55%)] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95"
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(240, 101, 67, 0.25), 0 0 0 0 rgba(240, 101, 67, 0.3)',
            }}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </main>
      
      <Navigation />
    </div>
  );
}