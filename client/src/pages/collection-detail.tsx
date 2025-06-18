import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Plus, Check, HelpCircle, Grid, List, X, Search, Trash2, Camera, CheckSquare, Square, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/navigation";
import CardPhotoImport from "@/components/card-photo-import";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";

export default function CollectionDetail() {
  const params = useParams();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "bases" | "bases_numbered" | "autographs" | "hits" | "special_1_1">("bases");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullscreenCard, setShowFullscreenCard] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
    queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
  }, [collectionId, queryClient]);

  const updateCardImageMutation = useMutation({
    mutationFn: async ({ cardId, imageUrl }: { cardId: number; imageUrl: string }) => {
      return apiRequest("PATCH", `/api/cards/${cardId}/image`, { imageUrl });
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
  });

  const filteredCards = cards?.filter(card => {
    const matchesSearch = !searchTerm || 
      card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.reference.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "all": return card.cardType === "Base" && !card.cardSubType;
      case "owned": return card.isOwned && card.cardType === "Base" && !card.cardSubType;
      case "missing": return !card.isOwned && card.cardType === "Base" && !card.cardSubType;
      case "bases": return card.cardType === "Base" && !card.cardSubType;
      case "bases_numbered": return card.cardType.includes("Parallel Laser") || card.cardType.includes("Parallel Swirl");
      case "autographs": return card.cardType === "Autograph";
      case "hits": return card.cardType.includes("Insert");
      case "special_1_1": return card.cardType === "special_1_1" || card.numbering === "1/1";
      default: return card.cardType === "Base" && !card.cardSubType;
    }
  });

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

  // Bulk actions functions
  const handleCardSelection = (cardId: number, checked: boolean) => {
    const newSelection = new Set(selectedCards);
    if (checked) {
      newSelection.add(cardId);
    } else {
      newSelection.delete(cardId);
    }
    setSelectedCards(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const handleSelectAll = () => {
    if (!filteredCards) return;
    const allCardIds = new Set(filteredCards.map(card => card.id));
    setSelectedCards(allCardIds);
    setShowBulkActions(true);
  };

  const handleDeselectAll = () => {
    setSelectedCards(new Set());
    setShowBulkActions(false);
  };

  const handleBulkMarkAsOwned = async () => {
    try {
      const promises = Array.from(selectedCards).map(cardId => 
        apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned: true })
      );
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      setSelectedCards(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "Cartes marquées comme acquises",
        description: `${selectedCards.size} carte(s) marquée(s) comme acquise(s).`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les cartes.",
        variant: "destructive"
      });
    }
  };

  const handleBulkMarkAsNotOwned = async () => {
    try {
      const promises = Array.from(selectedCards).map(cardId => 
        apiRequest("POST", `/api/cards/${cardId}/ownership`, { isOwned: false })
      );
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/cards`] });
      setSelectedCards(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "Cartes marquées comme manquantes",
        description: `${selectedCards.size} carte(s) marquée(s) comme manquante(s).`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les cartes.",
        variant: "destructive"
      });
    }
  };

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setCurrentVariantIndex(0);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-3 pt-3 pb-20">
        {/* Top Tabs - like Sorare design */}
        <div className="flex items-center mb-4 border-b border-gray-700">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-3 text-sm font-medium ${
              filter === "all" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilter("owned")}
            className={`px-4 py-3 text-sm font-medium ${
              filter === "owned" 
                ? "text-white border-b-2 border-white" 
                : "text-gray-400"
            }`}
          >
            ❤️ Mes favoris
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer par joueur ou équipe"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Bookmark icon */}
          <button className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="w-4 h-4 border border-gray-400"></div>
          </button>
          
          {/* Info icon */}
          <button className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          </button>
        </div>

        {/* Selection Controls */}
        {selectedCards.size > 0 ? (
          <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm">
                {selectedCards.size} sélectionnée(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkAsOwned}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Marquer comme acquises"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleBulkMarkAsNotOwned}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Marquer comme manquantes"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleDeselectAll}
                className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                title="Désélectionner tout"
              >
                <Square className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          filteredCards && filteredCards.length > 0 && (
            <div className="mb-4">
              <button
                onClick={handleSelectAll}
                className="text-blue-400 text-sm hover:text-blue-300"
              >
                Tout sélectionner
              </button>
            </div>
          )
        )}

        {/* Cards Grid - Sorare style */}
        <div className="grid grid-cols-2 gap-3">
          {filteredCards?.map((card) => (
            <div 
              key={card.id} 
              className="relative bg-gray-900 rounded-xl overflow-hidden"
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-20">
                <input
                  type="checkbox"
                  checked={selectedCards.has(card.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCardSelection(card.id, e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500"
                />
              </div>
              
              {/* Card Number Badge */}
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                {card.reference}
              </div>
              
              {/* Card Content */}
              <div 
                onClick={() => handleCardSelect(card)}
                className="cursor-pointer"
              >
                {/* Card Image */}
                <div className="aspect-[3/4] bg-gradient-to-br from-orange-500 to-red-600 relative">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.playerName || ""} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HelpCircle className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}
                  
                  {/* Player Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div className="text-white font-bold text-sm">
                      {card.playerName?.toUpperCase() || 'JOUEUR INCONNU'}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {card.teamName}
                    </div>
                  </div>
                </div>
                
                {/* Stats Bar */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-white">85</span>
                    </div>
                    <div className="text-xs text-gray-400">+5%</div>
                    <div className="text-xs text-blue-400">23</div>
                  </div>
                  
                  {/* Price */}
                  <div className="text-white font-bold text-sm mb-1">
                    {card.isOwned ? "Acquise" : "37,99 €"}
                  </div>
                  {!card.isOwned && (
                    <div className="text-gray-400 text-xs">0,0173 ETH</div>
                  )}
                  
                  {/* Buy Button */}
                  {!card.isOwned && (
                    <button className="w-full bg-white text-black font-medium py-2 rounded-lg mt-2 text-sm">
                      Acheter
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Navigation />

      {/* Photo Upload Modal */}
      <CardPhotoImport
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onSave={(imageUrl: string, cardId?: number) => {
          if (cardId) {
            updateCardImageMutation.mutate({ cardId, imageUrl });
          }
          setShowPhotoUpload(false);
        }}
        availableCards={(filteredCards || []).map(card => ({
          id: card.id,
          cardNumber: card.reference,
          playerName: card.playerName || "Joueur Inconnu",
          teamName: card.teamName || "Équipe Inconnue",
          cardType: card.cardType,
          collectionId: card.collectionId
        }))}
        preselectedCard={selectedCard ? {
          id: selectedCard.id,
          playerName: selectedCard.playerName || "Joueur Inconnu",
          reference: selectedCard.reference,
          teamName: selectedCard.teamName || "Équipe Inconnue"
        } : undefined}
      />
    </div>
  );
}