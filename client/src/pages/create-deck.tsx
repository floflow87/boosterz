import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Upload, Palette, Check } from "lucide-react";
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

const themeOptions = [
  {
    id: "main+background",
    name: "Par défaut",
    backgroundColor: "#1A2332",
    accentColor: "#F37261",
    preview: "bg-[#1A2332] border-[#F37261]"
  },
  {
    id: "white+sky",
    name: "Blanc & Bleu ciel",
    backgroundColor: "#FFFFFF",
    accentColor: "#87CEEB",
    preview: "bg-white border-sky-400"
  },
  {
    id: "red+navy",
    name: "Rouge & Bleu marine",
    backgroundColor: "#FF0000",
    accentColor: "#000080",
    preview: "bg-red-500 border-navy-800"
  },
  {
    id: "navy+gold",
    name: "Bleu marine & Or",
    backgroundColor: "#000080",
    accentColor: "#FFD700",
    preview: "bg-navy-800 border-yellow-500"
  },
  {
    id: "white+red",
    name: "Blanc & Rouge",
    backgroundColor: "#FFFFFF",
    accentColor: "#DC2626",
    preview: "bg-white border-red-600"
  },
  {
    id: "white+blue",
    name: "Blanc & Bleu",
    backgroundColor: "#FFFFFF",
    accentColor: "#3B82F6",
    preview: "bg-white border-blue-500"
  }
];

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

  // Fetch user's cards (from collections and personal cards)
  const { data: collectionCards = [] } = useQuery<Card[]>({
    queryKey: ["/api/cards/all"],
    staleTime: 5 * 60 * 1000,
  });

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
        });
        setLocation(`/deck/${deckId}`);
      } else {
        toast({
          title: "Deck créé avec succès !",
          description: `Ton deck "${deckName}" a été créé.`,
        });
        setLocation("/collections");
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
    if (!deckName.trim()) {
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

    const selectedThemeData = themeOptions.find(t => t.id === selectedTheme);
    
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

    createDeckMutation.mutate(deckData);
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

  const selectedThemeData = themeOptions.find(t => t.id === selectedTheme);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header 
        title={isAddMode && existingDeck 
          ? `${existingDeck.name} - ${(existingDeck.cards?.length || 0) + selectedCards.length}/12`
          : "Créer un deck"
        } 
        showBackButton 
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
              <Label className="text-white mb-3 block">
                <Palette className="w-4 h-4 inline mr-2" />
                Thème de couleur
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      selectedTheme === theme.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-600 hover:border-gray-500"
                    )}
                  >
                    <div className={cn(
                      "w-full h-8 rounded mb-2 border-2",
                      theme.preview
                    )} />
                    <div className="text-white text-sm font-medium">
                      {theme.name}
                    </div>
                    {selectedTheme === theme.id && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
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
                {!isAddMode && (
                  <Button
                    onClick={() => setShowCardSelector(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter ta première carte
                  </Button>
                )}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(216,46%,13%)] rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-bold">Choisir une carte</h3>
              <button
                onClick={() => setShowCardSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {availableCards.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => 
                      item.type === 'collection' 
                        ? handleAddCard(item.card as Card)
                        : handleAddCard(undefined, item.card as PersonalCard)
                    }
                    className="aspect-[2.5/3.5] bg-[hsl(214,35%,22%)] rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
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
                  </button>
                ))}
              </div>
              {availableCards.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Aucune carte disponible
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}