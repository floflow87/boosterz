import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Plus, ArrowLeftRight, Check, HelpCircle, Grid, List, Star, Sparkles, X, Info } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import CardPhotoImport from "@/components/card-photo-import";
import { apiRequest } from "@/lib/queryClient";
import type { Collection, Card } from "@shared/schema";

export default function CollectionDetail() {
  const params = useParams();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "bases" | "bases_numbered" | "autographs" | "hits" | "speciales">("bases");
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

  const handlePhotoSave = (imageData: string, cardId?: number) => {
    if (cardId) {
      updateCardImageMutation.mutate({ cardId, imageData });
    }
    setShowPhotoUpload(false);
  };

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
    if (filter === "bases") return card.cardType.toLowerCase() === "base";
    if (filter === "bases_numbered") return card.cardType.toLowerCase() === "numbered" || (card.cardType.toLowerCase() === "parallel" && card.serialNumber);
    if (filter === "autographs") return card.cardType.toLowerCase() === "autograph";
    if (filter === "speciales") return card.cardType.toLowerCase() === "special" || card.serialNumber === "1/1" || card.serialNumber === "/1";
    if (filter === "hits") return card.cardType.toLowerCase() === "hit";
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
      
      // If same rarity, sort by card number
      const aNum = parseInt(a.cardNumber.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.cardNumber.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum;
    }
    // Sort base cards by card number
    if (filter === "bases") {
      const aNum = parseInt(a.cardNumber.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.cardNumber.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum; // Ascending order
    }
    return 0;
  });

  const ownedCount = cards?.filter(card => card.isOwned).length || 0;
  const totalCount = cards?.length || 0;
  const missingCount = totalCount - ownedCount;
  const basesCount = cards?.filter(card => card.cardType.toLowerCase() === "base").length || 0;
  const basesNumberedCount = cards?.filter(card => card.cardType.toLowerCase() === "numbered" || (card.cardType.toLowerCase() === "parallel" && card.serialNumber)).length || 0;
  const autographsCount = cards?.filter(card => card.cardType.toLowerCase() === "autograph").length || 0;
  const specialesCount = cards?.filter(card => card.cardType.toLowerCase() === "special" || card.serialNumber === "1/1" || card.serialNumber === "/1").length || 0;
  const hitsCount = cards?.filter(card => card.cardType.toLowerCase() === "hit").length || 0;

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <Header title={collection.name} showBackButton />

      <main className="relative z-10 px-4 pb-24">
        {/* Collection Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-[hsl(9,85%,67%)] to-[hsl(25,100%,70%)] rounded-2xl p-6 mb-4">
            {collection.name === 'SCORE LIGUE 1' ? (
              <>
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/attached_assets/image%2029_1750232088999.png" 
                    alt="Score Ligue 1 logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white font-luckiest">{collection.name}</h1>
                <p className="text-white opacity-90 font-poppins">{collection.season}</p>
              </>
            ) : (
              <>
                <div className="w-24 h-32 bg-yellow-400 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="text-[hsl(216,46%,13%)] font-bold text-lg text-center">
                    {collection.name.split(' ')[0]}<br />
                    {collection.name.split(' ')[1]}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white font-luckiest">{collection.name}</h1>
                <p className="text-white opacity-90 font-poppins">Saison {collection.season}</p>
              </>
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
              onClick={() => setFilter("speciales")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === "speciales" 
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
                    {card.cardNumber}
                  </div>
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
                    <div className="text-[hsl(212,23%,69%)]">{card.cardNumber}</div>
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
                  <div className="text-sm text-[hsl(212,23%,69%)]">{card.cardNumber}</div>
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
                <span className="text-[hsl(212,23%,69%)]">Numéro:</span>
                <span className="text-white">{selectedCard.cardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Type:</span>
                <span className="text-white">{selectedCard.cardType}</span>
              </div>
              {selectedCard.serialNumber && (
                <div className="flex justify-between">
                  <span className="text-[hsl(212,23%,69%)]">Numérotée:</span>
                  <span className="text-yellow-400 font-bold">{selectedCard.serialNumber}</span>
                </div>
              )}
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
          cardNumber: card.cardNumber,
          playerName: card.playerName || "Joueur Inconnu",
          teamName: card.teamName || "Équipe Inconnue",
          cardType: card.cardType,
          collectionId: card.collectionId
        }))}
      />
    </div>
  );
}
