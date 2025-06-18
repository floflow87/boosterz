import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Plus, ArrowLeftRight, Check, HelpCircle, Grid, List, Star, Sparkles, X, Info } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import CardPhotoImport from "@/components/card-photo-import";
import CardVariantsCarousel from "@/components/card-variants-carousel";
import { apiRequest } from "@/lib/queryClient";
import type { Collection, Card } from "@shared/schema";
import scoreLigue1Logo from "@assets/image 29_1750232088999.png";
import headerBackground from "@assets/Ellipse 419_1750248420742.png";

export default function CollectionDetail() {
  const params = useParams();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "bases" | "bases_numbered" | "autographs" | "hits" | "special_1_1">("bases");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Clear cache on component mount to get fresh data
    queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
    queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
  }, [collectionId, queryClient]);

  const updateCardImageMutation = useMutation({
    mutationFn: async ({ cardId, imageData }: { cardId: number; imageData: string }) => {
      return apiRequest("PATCH", `/api/cards/${cardId}/image`, { imageUrl: imageData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
    }
  });



  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const filteredCards = cards?.filter((card) => {
    if (filter === "owned") return card.isOwned;
    if (filter === "missing") return !card.isOwned;
    if (filter === "bases") return card.cardType === "Base";
    if (filter === "bases_numbered") return card.cardType.includes("Parallel Laser") || card.cardType.includes("Parallel Swirl");
    if (filter === "autographs") return card.cardType === "Autograph";
    if (filter === "special_1_1") return card.cardType === "special_1_1" || card.numbering === "1/1";
    if (filter === "hits") return card.cardType.includes("Insert");
    return true;
  })?.sort((a, b) => {
    // Sort bases numbered by rarity hierarchy: /50, /35, /30, /25, /20, /15 swirl, /15 laser, /10 gold, /5
    if (filter === "bases_numbered" && a.serialNumber && b.serialNumber) {
      const getRarityOrder = (serialNumber: string, cardSubType: string) => {
        const total = parseInt(serialNumber.split('/')[1]) || 0;
        if (total === 50) return 1;
        if (total === 35) return 2;
        if (total === 30) return 3;
        if (total === 25) return 4;
        if (total === 20) return 5;
        if (total === 15 && cardSubType === "swirl") return 6;
        if (total === 15 && cardSubType === "laser") return 7;
        if (total === 10) return 8;
        if (total === 5) return 9;
        return 10;
      };
      
      const aOrder = getRarityOrder(a.serialNumber, a.cardSubType || "");
      const bOrder = getRarityOrder(b.serialNumber, b.cardSubType || "");
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // If same rarity, sort by reference
      const aNum = parseInt(a.reference.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.reference.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum;
    }
    // Sort base cards by reference
    if (filter === "bases") {
      const aNum = parseInt(a.reference.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.reference.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum; // Ascending order
    }
    return 0;
  });

  const ownedCount = cards?.filter(card => card.isOwned).length || 0;
  const totalCount = cards?.length || 0;
  const missingCount = totalCount - ownedCount;
  const basesCount = cards?.filter(card => 
    card.cardType === "Base"
  ).length || 0;
  const basesNumberedCount = cards?.filter(card => 
    card.cardType.includes("Parallel Laser") || card.cardType.includes("Parallel Swirl")
  ).length || 0;
  const autographsCount = cards?.filter(card => card.cardType === "Autograph").length || 0;
  const specialesCount = cards?.filter(card => card.cardType === "special_1_1" || card.numbering === "1/1").length || 0;
  const hitsCount = cards?.filter(card => 
    card.cardType.includes("Insert")
  ).length || 0;

  if (collectionLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
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

  const handleMarkAsOwned = async (cardId: number, withPhoto: boolean) => {
    try {
      const response = await apiRequest(`/api/cards/${cardId}/ownership`, {
        method: 'POST',
        body: JSON.stringify({ isOwned: true })
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
        setSelectedCard(null);
        
        if (withPhoto) {
          setShowPhotoUpload(true);
        }
        
        toast({
          title: "Carte marquée comme possédée",
          description: "Le statut de la carte a été mis à jour."
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la carte.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsNotOwned = async (cardId: number) => {
    try {
      const response = await apiRequest(`/api/cards/${cardId}/ownership`, {
        method: 'POST',
        body: JSON.stringify({ isOwned: false })
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
        setSelectedCard(null);
        
        toast({
          title: "Carte marquée comme manquante",
          description: "Le statut de la carte a été mis à jour."
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la carte.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoSave = (imageData: string, cardId?: number) => {
    if (cardId) {
      updateCardImageMutation.mutate({ cardId, imageData });
    }
    setShowPhotoUpload(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <Header title={collection.name} showBackButton />

      <main className="relative z-10 px-4 pb-24">
        {/* Collection Header avec fond personnalisé */}
        <div className="text-center mb-4">
          <div 
            className="relative rounded-xl p-6 mb-3 overflow-hidden"
            style={{
              backgroundImage: `url(${headerBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {collection.name === 'SCORE LIGUE 1' ? (
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src={scoreLigue1Logo} 
                    alt="Score Ligue 1 logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white font-luckiest">{collection.name}</h1>
                  <p className="text-white opacity-90 font-poppins text-sm">{collection.season}</p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 text-center">
                <h1 className="text-2xl font-bold text-white font-luckiest mb-2">{collection.name}</h1>
                <p className="text-white opacity-90 font-poppins text-sm">{collection.season}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-6 text-center">
            <div>
              <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{collection.totalCards}</div>
              <div className="text-xs text-[hsl(212,23%,69%)]">Cartes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{collection.ownedCards}</div>
              <div className="text-xs text-[hsl(212,23%,69%)]">Possédées</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{collection.completionPercentage}%</div>
              <div className="text-xs text-[hsl(212,23%,69%)]">Complété</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={() => setShowPhotoUpload(true)}
            className="bg-[hsl(9,85%,67%)] text-white p-2 rounded-lg hover:bg-[hsl(9,85%,57%)] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 animate-pulse-glow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs - Score Ligue 1 */}
        {collection.name.includes("SCORE LIGUE 1") ? (
          <div className="flex space-x-2 mb-6 overflow-x-auto scroll-container">
            <button
              onClick={() => setFilter("bases")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "bases" 
                  ? "bg-gray-500 text-white shadow-lg transform scale-105" 
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Bases ({basesCount})
            </button>
            <button
              onClick={() => setFilter("bases_numbered")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "bases_numbered" 
                  ? "bg-[hsl(9,85%,67%)] text-white shadow-lg transform scale-105" 
                  : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <Check className="w-4 h-4 inline mr-1" />
              Bases numérotées ({basesNumberedCount})
            </button>
            <button
              onClick={() => setFilter("autographs")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "autographs" 
                  ? "bg-[hsl(9,85%,67%)] text-white shadow-lg transform scale-105" 
                  : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <HelpCircle className="w-4 h-4 inline mr-1" />
              Autographes ({autographsCount})
            </button>
            <button
              onClick={() => setFilter("hits")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "hits" 
                  ? "bg-purple-500 text-white shadow-lg transform scale-105" 
                  : "bg-purple-600 text-purple-100 hover:bg-purple-500"
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Hit ({hitsCount})
            </button>
            <button
              onClick={() => setFilter("special_1_1")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "special_1_1" 
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg transform scale-105 animate-pulse" 
                  : "bg-gradient-to-r from-yellow-600 to-yellow-800 text-yellow-100 hover:from-yellow-500 hover:to-yellow-700"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              Spéciales 1/1 ({specialesCount})
            </button>
          </div>
        ) : (
          <div className="flex space-x-2 mb-6 overflow-x-auto scroll-container">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "all" 
                  ? "bg-[hsl(9,85%,67%)] text-white shadow-lg transform scale-105" 
                  : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Toutes ({totalCount})
            </button>
            <button
              onClick={() => setFilter("owned")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "owned" 
                  ? "bg-[hsl(9,85%,67%)] text-white shadow-lg transform scale-105" 
                  : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <Check className="w-4 h-4 inline mr-1" />
              Possédées ({ownedCount})
            </button>
            <button
              onClick={() => setFilter("missing")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "missing" 
                  ? "bg-[hsl(9,85%,67%)] text-white shadow-lg transform scale-105" 
                  : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <HelpCircle className="w-4 h-4 inline mr-1" />
              Manquantes ({missingCount})
            </button>
          </div>
        )}

        {/* Cards Display */}
        
        {viewMode === "grid" ? (
          <div className="card-grid">
            {filteredCards?.map((card, index) => (
              <div 
                key={card.id} 
                onClick={() => setSelectedCard(card)}
                className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 relative border-2 transition-all cursor-pointer hover:scale-105 transform duration-300 ${
                  card.isOwned 
                    ? "border-green-500 bg-opacity-100 shadow-lg" 
                    : "border-gray-600 bg-opacity-50"
                } ${card.cardType === "Autograph" ? "ring-2 ring-yellow-400" : ""}`}
              >
              {card.imageUrl ? (
                <>
                  <img 
                    src={card.imageUrl} 
                    alt={`${card.playerName} card`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {card.reference}
                  </div>
                  {card.numbering && (
                    <div className="absolute bottom-1 right-1 bg-blue-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded">
                      {card.numbering}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-full h-32 bg-gray-600 rounded-lg flex items-center justify-center opacity-50">
                    <HelpCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-xs mt-1 text-center">
                    <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-gray-300'}`}>
                      {card.playerName || 'Joueur Inconnu'}
                    </div>
                    <div className="text-[hsl(212,23%,69%)]">{card.reference}</div>
                    <div className="text-[hsl(212,23%,69%)] text-xs">{card.teamName}</div>
                  </div>
                </>
              )}
            </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards?.map((card) => (
              <div 
                key={card.id} 
                onClick={() => setSelectedCard(card)}
                className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 flex items-center space-x-3 border-2 transition-all cursor-pointer hover:scale-[1.02] ${
                  card.isOwned 
                    ? "border-green-500" 
                    : "border-gray-600"
                }`}>
                <div className="w-12 h-16 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center relative">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.playerName || ""} className="w-full h-full object-cover rounded" />
                  ) : (
                    <HelpCircle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  {card.imageUrl ? (
                    <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-gray-300'}`}>
                      Photo de carte
                    </div>
                  ) : (
                    <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-gray-300'}`}>
                      {card.playerName || 'Joueur Inconnu'}
                    </div>
                  )}
                  <div className="text-sm text-[hsl(212,23%,69%)]">{card.reference}</div>
                  <div className="text-xs text-[hsl(212,23%,69%)]">{card.teamName}</div>
                </div>
                {card.isOwned && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}


      </main>

      <Navigation />

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-4">
              {selectedCard.isOwned && selectedCard.imageUrl ? (
                <img 
                  src={selectedCard.imageUrl} 
                  alt={selectedCard.playerName || "Card"} 
                  className="w-32 h-40 object-cover rounded-lg mx-auto mb-3"
                />
              ) : (
                <div className="w-32 h-40 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-1">
                {selectedCard.playerName || "Carte Inconnue"}
              </h3>
              <p className="text-[hsl(212,23%,69%)]">{selectedCard.teamName}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Référence:</span>
                <span className="text-white">{selectedCard.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Type:</span>
                <span className="text-white">
                  {selectedCard.cardType === 'Base' ? 'Base' :
                   selectedCard.cardType === 'Parallel Laser Blue' ? 'Laser' :
                   selectedCard.cardType.includes('Swirl') ? 'Swirl' :
                   selectedCard.cardType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Numérotation:</span>
                <span className="text-yellow-400 font-bold">
                  {selectedCard.numbering || 'Non numérotée'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Rareté:</span>
                <span className="text-white capitalize">{selectedCard.rarity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Statut:</span>
                <span className={`font-bold ${selectedCard.isOwned ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedCard.isOwned ? 'Possédée' : 'Manquante'}
                </span>
              </div>
            </div>

            {selectedCard.cardType === "Special" && selectedCard.serialNumber === "1/1" && (
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5 text-yellow-200" />
                  <span className="text-yellow-100 font-bold">Carte Ultra Rare 1/1</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {!selectedCard.isOwned ? (
                <>
                  <button
                    onClick={() => handleMarkAsOwned(selectedCard.id, false)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    Marquer comme possédée
                  </button>
                  <button
                    onClick={() => handleMarkAsOwned(selectedCard.id, true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Posséder + Ajouter photo
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleMarkAsNotOwned(selectedCard.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 inline mr-2" />
                    Marquer comme manquante
                  </button>
                  {!selectedCard.imageUrl && (
                    <button
                      onClick={() => {
                        setSelectedCard(null);
                        setShowPhotoUpload(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Ajouter une photo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      <CardPhotoImport
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onSave={handlePhotoSave}
        availableCards={(filteredCards || []).map(card => ({
          id: card.id,
          cardNumber: card.reference,
          playerName: card.playerName || "Joueur Inconnu",
          teamName: card.teamName || "Équipe Inconnue",
          cardType: card.cardType,
          collectionId: card.collectionId
        }))}
      />
    </div>
  );
}
