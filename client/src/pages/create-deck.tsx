import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Upload, Palette, Check, ChevronDown, ChevronUp, Square, CheckSquare } from "lucide-react";
import { Card, PersonalCard, Deck } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DeckCard {
  card?: Card;
  personalCard?: PersonalCard;
  position: number;
}

const themeStyles = {
  "main+background": {
    backgroundColor: "#1A2332",
    accentColor: "#F37261",
    gradientClass: "bg-gradient-radial from-[#1A2332] via-[#1A2332] to-[#F37261]"
  },
  "white+sky": {
    backgroundColor: "#FFFFFF",
    accentColor: "#87CEEB",
    gradientClass: "bg-gradient-radial from-white via-white to-sky-400"
  },
  "red+navy": {
    backgroundColor: "#FF0000",
    accentColor: "#000080",
    gradientClass: "bg-gradient-radial from-red-500 via-red-500 to-blue-900"
  },
  "navy+bronze": {
    backgroundColor: "#000080",
    accentColor: "#CD7F32",
    gradientClass: "bg-gradient-radial from-blue-900 via-blue-900 to-orange-600"
  },
  "white+red": {
    backgroundColor: "#FFFFFF",
    accentColor: "#DC2626",
    gradientClass: "bg-gradient-radial from-white via-white to-red-600"
  },
  "white+blue": {
    backgroundColor: "#FFFFFF",
    accentColor: "#3B82F6",
    gradientClass: "bg-gradient-radial from-white via-white to-blue-500"
  },
  "gold+black": {
    backgroundColor: "#FFD700",
    accentColor: "#000000",
    gradientClass: "bg-gradient-radial from-yellow-500 via-yellow-500 to-black"
  },
  "green+white": {
    backgroundColor: "#22C55E",
    accentColor: "#FFFFFF",
    gradientClass: "bg-gradient-radial from-green-500 via-green-500 to-white"
  },
  "red+black": {
    backgroundColor: "#DC2626",
    accentColor: "#000000",
    gradientClass: "bg-gradient-radial from-red-600 via-red-600 to-black"
  },
  "blue+white+red": {
    backgroundColor: "#3B82F6",
    accentColor: "#DC2626",
    gradientClass: "bg-gradient-radial from-blue-500 via-white to-red-600"
  },
  "full+black": {
    backgroundColor: "#000000",
    accentColor: "#FFFFFF",
    gradientClass: "bg-black border-2 border-white"
  }
};

export default function CreateDeck() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Vérifier les paramètres URL pour le mode ajout
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const deckId = urlParams.get('deckId');
  const isAddMode = mode === 'add' && deckId;

  const [deckName, setDeckName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("main+background");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<DeckCard[]>([]);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedCardsToAdd, setSelectedCardsToAdd] = useState<Set<string>>(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);

  // Fetch user's cards (from collections and personal cards)
  const { data: collectionCardsData } = useQuery({
    queryKey: ["/api/cards/all"],
    staleTime: 5 * 60 * 1000,
  });

  const collectionCards = collectionCardsData?.cards || [];

  const { data: personalCards = [] } = useQuery<PersonalCard[]>({
    queryKey: ["/api/personal-cards"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch existing deck data when in add mode
  const { data: existingDeck } = useQuery({
    queryKey: [`/api/decks/${deckId}`],
    enabled: Boolean(deckId && isAddMode),
    staleTime: 5 * 60 * 1000,
  }) as { data?: { id: number; name: string; cards: any[] } };

  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (deckData: any) => {
      if (isAddMode) {
        // Mode ajout - ajouter les cartes au deck existant
        const response = await fetch(`/api/decks/${deckId}/cards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cards: deckData.cards }),
        });
        if (!response.ok) throw new Error("Failed to add cards to deck");
        return response.json();
      } else {
        // Mode création - créer un nouveau deck
        const response = await fetch("/api/decks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deckData),
        });
        if (!response.ok) throw new Error("Failed to create deck");
        return response.json();
      }
    },
    onSuccess: (result) => {
      if (isAddMode) {
        toast({
          title: "Cartes ajoutées !",
          description: `${selectedCards.length} carte${selectedCards.length > 1 ? 's' : ''} ajoutée${selectedCards.length > 1 ? 's' : ''} au deck.`,
          className: "bg-green-600 text-white border-green-700",
        });
        setLocation(`/deck/${deckId}`);
      } else {
        toast({
          title: "Deck créé avec succès !",
          description: `Ton deck "${deckName}" a été créé.`,
          className: "bg-green-600 text-white border-green-700"
        });
        setLocation(`/deck/${result.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}`] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: isAddMode ? "Impossible d'ajouter les cartes. Réessaie plus tard." : "Impossible de créer le deck. Réessaie plus tard.",
        variant: "destructive",
      });
    },
  });

  // Toggle card selection
  const toggleCardSelection = (cardId: string) => {
    setSelectedCardsToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Select/Deselect all cards
  const handleSelectAllToggle = () => {
    if (selectAllMode) {
      setSelectedCardsToAdd(new Set());
      setSelectAllMode(false);
    } else {
      const allCardIds = availableCards.map(item => {
        if (item.type === 'collection') {
          return `collection-${item.card.id}`;
        } else {
          return `personal-${item.card.id}`;
        }
      });
      setSelectedCardsToAdd(new Set(allCardIds));
      setSelectAllMode(true);
    }
  };

  // Add selected cards to deck
  const handleAddSelectedCards = () => {
    const cardsToAdd: DeckCard[] = [];
    
    selectedCardsToAdd.forEach(cardId => {
      const [type, id] = cardId.split('-');
      const item = availableCards.find(item => {
        if (type === 'collection' && item.type === 'collection') {
          return item.card.id.toString() === id;
        } else if (type === 'personal' && item.type === 'personal') {
          return item.card.id.toString() === id;
        }
        return false;
      });

      if (item && selectedCards.length + cardsToAdd.length < 12) {
        const newCard: DeckCard = {
          card: item.type === 'collection' ? item.card as Card : undefined,
          personalCard: item.type === 'personal' ? item.card as PersonalCard : undefined,
          position: selectedCards.length + cardsToAdd.length
        };
        cardsToAdd.push(newCard);
      }
    });

    if (cardsToAdd.length > 0) {
      setSelectedCards([...selectedCards, ...cardsToAdd]);
      setSelectedCardsToAdd(new Set());
      setSelectAllMode(false);
      setShowCardSelector(false);
      
      toast({
        title: "Cartes ajoutées",
        description: `${cardsToAdd.length} carte(s) ajoutée(s) au deck.`,
        className: "bg-green-900 border-green-700 text-green-100"
      });
    }
  };

  const handleAddCard = (card?: Card, personalCard?: PersonalCard) => {
    if (selectedCards.length >= 12) {
      toast({
        title: "Limite atteinte",
        description: "Un deck ne peut contenir que 12 cartes maximum.",
        variant: "destructive",
      });
      return;
    }

    const newCard: DeckCard = {
      card,
      personalCard,
      position: selectedCards.length
    };

    setSelectedCards([...selectedCards, newCard]);
    setShowCardSelector(false);
  };

  const handleRemoveCard = (position: number) => {
    const newCards = selectedCards
      .filter(c => c.position !== position)
      .map((c, index) => ({ ...c, position: index }));
    setSelectedCards(newCards);
  };

  const handleCreateDeck = () => {
    // En mode ajout, pas besoin de nom de deck
    if (!isAddMode && !deckName.trim()) {
      toast({
        title: "Nom requis",
        description: "Donne un nom à ton deck.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCards.length === 0) {
      toast({
        title: "Cartes requises",
        description: "Ajoute au moins une carte à ton deck.",
        variant: "destructive",
      });
      return;
    }

    const selectedThemeData = themeStyles[selectedTheme as keyof typeof themeStyles] || themeStyles["main+background"];
    
    const deckData = {
      name: deckName,
      themeColors: selectedTheme,
      backgroundColor: selectedThemeData?.backgroundColor,
      accentColor: selectedThemeData?.accentColor,
      coverImage,
      cardCount: selectedCards.length,
      cards: selectedCards.map(c => ({
        cardId: c.card?.id || null,
        personalCardId: c.personalCard?.id || null,
        position: c.position
      }))
    };

    createDeckMutation.mutate(deckData, {
      onSuccess: (response) => {
        toast({
          title: "Deck créé !",
          description: `Le deck "${deckName}" a été créé avec succès.`,
          className: "bg-green-600 text-white border-green-600",
        });
        // Rediriger vers la page du deck créé
        setLocation(`/deck/${response.id}`);
      }
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const availableCards = [
    ...collectionCards.filter(c => c.isOwned).map(c => ({ type: 'collection', card: c })),
    ...personalCards.filter(c => !c.isSold).map(c => ({ type: 'personal', card: c }))
  ];

  const selectedThemeData = themeStyles[selectedTheme as keyof typeof themeStyles] || themeStyles["main+background"];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header 
        title={isAddMode && existingDeck 
          ? `${existingDeck.name} - ${(existingDeck.cards?.length || 0) + selectedCards.length}/12`
          : "Créer un deck"
        } 
        showBackButton 
        onBack={() => setLocation('/collections?tab=decks')}
      />
      
      <main className="relative z-10 px-4 pb-24 pt-4">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Deck Name - Hidden in add mode */}
          {!isAddMode && (
            <div>
              <Label htmlFor="deckName" className="text-white mb-2 block">
                Nom du deck *
              </Label>
              <Input
                id="deckName"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Mon super deck"
                className="bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-white"
              />
            </div>
          )}

          {/* Theme Selection - Hidden in add mode */}
          {!isAddMode && (
            <div>
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="w-full flex items-center justify-between p-3 bg-[hsl(214,35%,18%)] rounded-lg border border-gray-600 hover:border-gray-500 transition-colors mb-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn("w-8 h-8 rounded", themeStyles[selectedTheme as keyof typeof themeStyles]?.gradientClass || themeStyles["main+background"].gradientClass)}
                  />
                  <div>
                    <Label className="text-white text-sm font-medium">Thème</Label>
                    <div className="text-gray-400 text-xs">
                      {selectedTheme === "main+background" && "Défaut"}
                      {selectedTheme === "white+sky" && "Blanc & Ciel"}
                      {selectedTheme === "red+navy" && "Rouge & Marine"}
                      {selectedTheme === "navy+bronze" && "Marine & Bronze"}
                      {selectedTheme === "white+red" && "Blanc & Rouge"}
                      {selectedTheme === "white+blue" && "Blanc & Bleu"}
                      {selectedTheme === "gold+black" && "Or & Noir"}
                      {selectedTheme === "green+white" && "Vert & Blanc"}
                      {selectedTheme === "red+black" && "Rouge & Noir"}
                      {selectedTheme === "blue+white+red" && "Bleu Blanc Rouge"}
                      {selectedTheme === "full+black" && "Full noir"}
                    </div>
                  </div>
                </div>
                {showThemeSelector ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showThemeSelector && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.entries(themeStyles).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedTheme(key);
                        setShowThemeSelector(false);
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all",
                        selectedTheme === key
                          ? "border-white bg-white/10"
                          : "border-gray-600 hover:border-gray-400"
                      )}
                    >
                      <div
                        className={cn("w-full h-8 rounded", theme.gradientClass)}
                      />
                      <div className="text-white text-xs mt-1 text-center">
                        {key === "main+background" && "Défaut"}
                        {key === "white+sky" && "Blanc & Ciel"}
                        {key === "red+navy" && "Rouge & Marine"}
                        {key === "navy+bronze" && "Marine & Bronze"}
                        {key === "white+red" && "Blanc & Rouge"}
                        {key === "white+blue" && "Blanc & Bleu"}
                        {key === "gold+black" && "Or & Noir"}
                        {key === "green+white" && "Vert & Blanc"}
                        {key === "red+black" && "Rouge & Noir"}
                        {key === "blue+white+red" && "Bleu Blanc Rouge"}
                        {key === "full+black" && "Full noir"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cover Image - Hidden in add mode */}
          {!isAddMode && (
            <div>
              <Label className="text-white mb-2 block">
                <Upload className="w-4 h-4 inline mr-2" />
                Image de couverture (optionnel)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="coverImageInput"
                />
                <label
                  htmlFor="coverImageInput"
                  className="cursor-pointer bg-[hsl(214,35%,22%)] border-2 border-dashed border-[hsl(214,35%,30%)] rounded-lg p-4 flex items-center justify-center text-gray-400 hover:border-primary transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Choisir une image
                </label>
                {coverImage && (
                  <div className="relative">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setCoverImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deck Preview */}
          {!isAddMode && deckName.trim() && (
            <div className="mb-6">
              <Label className="text-white mb-2 block">Aperçu du deck</Label>
              <div 
                className={cn(
                  "rounded-2xl p-4 relative overflow-hidden",
                  selectedThemeData.gradientClass
                )}
                style={{
                  borderColor: selectedThemeData.accentColor
                }}
              >
                {/* Background Cover Image */}
                {coverImage && (
                  <>
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${coverImage})`,
                        backgroundPosition: `center 50%`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </>
                )}
                <div className="relative z-10">
                  <h3 className={cn(
                    "text-lg font-bold font-luckiest mb-1",
                    coverImage 
                      ? "text-white drop-shadow-lg" 
                      : ["white+sky", "white+red", "white+blue", "green+white"].includes(selectedTheme) 
                        ? "text-black" 
                        : "text-white"
                  )}>
                    {deckName}
                  </h3>
                  <div className="text-sm">
                    <span className={cn(
                      coverImage 
                        ? "text-white/90 drop-shadow-lg"
                        : ["white+sky", "white+red", "white+blue", "green+white"].includes(selectedTheme) 
                          ? "text-black/80" 
                          : "text-white/80"
                    )}>
                      {selectedCards.length}/12 cartes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">
                Cartes sélectionnées ({selectedCards.length}/12)
              </Label>
              <Button
                onClick={() => setShowCardSelector(true)}
                disabled={selectedCards.length >= 12}
                className="bg-primary hover:bg-primary/90 text-white text-sm px-3 py-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>

            {selectedCards.length === 0 ? (
              <div className="bg-[hsl(214,35%,22%)] border-2 border-dashed border-[hsl(214,35%,30%)] rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">Aucune carte sélectionnée</div>

              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {selectedCards.map((deckCard, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-[2.5/3.5] bg-[hsl(214,35%,22%)] rounded-lg overflow-hidden">
                      {deckCard.card ? (
                        <CardDisplay
                          card={deckCard.card}
                          viewMode="grid"
                          variant="compact"
                        />
                      ) : deckCard.personalCard ? (
                        <div className="w-full h-full relative overflow-hidden">
                          {deckCard.personalCard.imageUrl ? (
                            <img
                              src={deckCard.personalCard.imageUrl}
                              alt={deckCard.personalCard.playerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs text-center p-2">
                              <div>
                                <div className="font-bold">{deckCard.personalCard.playerName}</div>
                                <div className="text-xs opacity-80">{deckCard.personalCard.teamName}</div>
                              </div>
                            </div>
                          )}
                          {/* Overlay avec nom du joueur */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center">
                            <div className="font-bold truncate">{deckCard.personalCard.playerName}</div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => handleRemoveCard(deckCard.position)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create/Add Button */}
          <Button
            onClick={handleCreateDeck}
            disabled={createDeckMutation.isPending || (!isAddMode && (!deckName.trim() || selectedCards.length === 0)) || (isAddMode && selectedCards.length === 0)}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3"
          >
            {createDeckMutation.isPending 
              ? (isAddMode ? "Ajout..." : "Création...") 
              : (isAddMode ? "Ajouter au deck" : "Créer le deck")
            }
          </Button>
        </div>
      </main>

      {/* Card Selector Modal */}
      {showCardSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
          <div className="bg-[hsl(216,46%,13%)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-bold">Choisir des cartes ({selectedCardsToAdd.size} sélectionnées)</h3>
              <button
                onClick={() => {
                  setShowCardSelector(false);
                  setSelectedCardsToAdd(new Set());
                  setSelectAllMode(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select All Toggle */}
            {availableCards.length > 0 && (
              <div className="p-4 border-b border-gray-700">
                <button
                  onClick={handleSelectAllToggle}
                  className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                >
                  {selectAllMode || selectedCardsToAdd.size === availableCards.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span>Sélectionner tout ({availableCards.length} cartes)</span>
                </button>
              </div>
            )}

            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {availableCards.map((item, index) => {
                  const cardId = item.type === 'collection' 
                    ? `collection-${item.card.id}` 
                    : `personal-${item.card.id}`;
                  const isSelected = selectedCardsToAdd.has(cardId);
                  
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => toggleCardSelection(cardId)}
                        className={cn(
                          "aspect-[2.5/3.5] bg-[hsl(214,35%,22%)] rounded-lg overflow-hidden transition-all relative",
                          isSelected 
                            ? "ring-2 ring-primary scale-95" 
                            : "hover:ring-2 hover:ring-gray-400"
                        )}
                      >
                        {item.type === 'collection' ? (
                          <CardDisplay
                            card={item.card as Card}
                            viewMode="grid"
                            variant="compact"
                          />
                        ) : (
                          <div className="w-full h-full relative overflow-hidden">
                            {(item.card as PersonalCard).imageUrl ? (
                              <img
                                src={(item.card as PersonalCard).imageUrl}
                                alt={(item.card as PersonalCard).playerName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs text-center p-2">
                                <div>
                                  <div className="font-bold">{(item.card as PersonalCard).playerName}</div>
                                  <div className="text-xs opacity-80">{(item.card as PersonalCard).teamName}</div>
                                </div>
                              </div>
                            )}
                            {/* Overlay avec nom du joueur */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center">
                              <div className="font-bold truncate">{(item.card as PersonalCard).playerName}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary rounded-full p-1">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                      
                      {/* Checkbox indicator */}
                      <div className="absolute -top-2 -right-2 z-10">
                        {isSelected ? (
                          <CheckSquare className="w-6 h-6 text-primary bg-white rounded" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400 bg-white rounded" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {availableCards.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Aucune carte disponible
                </div>
              )}
            </div>

            {/* Action buttons */}
            {selectedCardsToAdd.size > 0 && (
              <div className="p-4 border-t border-gray-700 flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedCardsToAdd(new Set());
                    setSelectAllMode(false);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Annuler sélection
                </Button>
                <Button
                  onClick={handleAddSelectedCards}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  disabled={selectedCards.length + selectedCardsToAdd.size > 12}
                >
                  Ajouter {selectedCardsToAdd.size} carte{selectedCardsToAdd.size > 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}