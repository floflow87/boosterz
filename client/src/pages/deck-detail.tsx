import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Trash2, Share2, Plus, X, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Deck, Card, PersonalCard } from "@shared/schema";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
import LoadingScreen from "@/components/LoadingScreen";
import MobileCardControls from "@/components/mobile-card-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DeckWithCards extends Omit<Deck, 'bannerPosition'> {
  bannerPosition?: number | null;
  cards: Array<{
    type: 'collection' | 'personal';
    card: Card | PersonalCard;
    position: number;
  }>;
}

const themeOptions = [
  { value: "marine+gold", label: "Marine & Bronze", gradient: "from-blue-900 via-blue-800 to-yellow-600" },
  { value: "gold+black", label: "Or & Noir", gradient: "from-yellow-500 via-yellow-600 to-gray-900" },
  { value: "white+sky", label: "Blanc & Ciel", gradient: "from-white via-blue-100 to-sky-400" },
  { value: "white+red", label: "Blanc & Rouge", gradient: "from-white via-red-100 to-red-500" },
  { value: "white+blue", label: "Blanc & Bleu", gradient: "from-white via-blue-100 to-blue-600" },
  { value: "green+white", label: "Vert & Blanc", gradient: "from-green-600 via-green-400 to-white" },
  { value: "red+black", label: "Rouge & Noir", gradient: "from-red-600 via-red-500 to-gray-900" },
  { value: "blue+white+red", label: "Bleu Blanc Rouge", gradient: "from-blue-600 via-white to-red-600" }
];

export default function DeckDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer l'utilisateur actuel
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me']
  });

  const { data: deck, isLoading } = useQuery<DeckWithCards>({
    queryKey: [`/api/decks/${id}`],
    enabled: !!id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [localCards, setLocalCards] = useState<DeckWithCards['cards']>([]);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editCoverImage, setEditCoverImage] = useState<string | null>(null);
  const [bannerPosition, setBannerPosition] = useState(50);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Synchroniser les cartes locales
  useEffect(() => {
    if (deck?.cards) {
      setLocalCards([...deck.cards]);
    }
    if (deck) {
      setEditName(deck.name);
      setEditTheme(deck.themeColors);
      setEditCoverImage(deck.coverImage);
      setBannerPosition(deck.bannerPosition ?? 50);
    }
  }, [deck]);

  // Vérifier si l'utilisateur actuel est le propriétaire du deck
  const currentUserId = (currentUser as any)?.user?.id || (currentUser as any)?.id;
  const isOwnerView = currentUserId === deck?.userId;

  console.log('👤 Is owner view:', isOwnerView);
  console.log('🎯 Deck owner ID:', deck?.userId);
  console.log('🧑‍💻 Current user ID:', currentUserId);
  console.log('🎮 LocalCards count:', localCards.length);
  console.log('🎯 FocusedCard:', focusedCard);

  // Fonction pour déplacer une carte
  const moveCard = (fromPosition: number, toPosition: number) => {
    if (fromPosition === toPosition) return;
    
    console.log('🔄 Moving card from position', fromPosition, 'to', toPosition);
    
    const oldIndex = localCards.findIndex(card => card.position === fromPosition);
    const newIndex = localCards.findIndex(card => card.position === toPosition);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newCards = [...localCards];
      const [movedCard] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, movedCard);
      
      // Réorganiser les positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: index
      }));
      
      setLocalCards(updatedCards);
      
      // Appeler l'API pour sauvegarder
      const newPositions = updatedCards.map((card, index) => ({
        cardId: card.type === 'collection' ? (card.card as Card).id : undefined,
        personalCardId: card.type === 'personal' ? (card.card as PersonalCard).id : undefined,
        position: index
      }));
      
      updatePositionsMutation.mutate(newPositions);
    }
  };

  // Mutation pour mettre à jour les positions
  const updatePositionsMutation = useMutation({
    mutationFn: async (newPositions: Array<{ cardId?: number; personalCardId?: number; position: number }>) => {
      const response = await fetch(`/api/decks/${id}/reorder`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'test'}`
        },
        body: JSON.stringify({ positions: newPositions })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update positions');
      }
      
      return response.json();
    },
    onError: (error) => {
      console.error('Erreur lors de la réorganisation:', error);
      toast({
        title: "Erreur", 
        description: "Impossible de réorganiser les cartes",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer une carte
  const removeCardMutation = useMutation({
    mutationFn: async (cardPosition: number) => {
      const response = await fetch(`/api/decks/${id}/cards/${cardPosition}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to remove card');
      return response.json();
    },
    onMutate: async (cardPosition: number) => {
      const updatedCards = localCards
        .filter(card => card.position !== cardPosition)
        .map((card, index) => ({
          ...card,
          position: index
        }));
      
      setLocalCards(updatedCards);
      setFocusedCard(null);
      
      toast({
        title: "Carte supprimée",
        description: "La carte a été retirée du deck avec succès",
        className: "bg-green-600 text-white border-green-700",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la carte",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer le deck
  const deleteDeckMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Deck supprimé avec succès!",
        className: "bg-green-600 text-white border-green-700"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
      queryClient.removeQueries({ queryKey: [`/api/decks/${id}`] });
      setLocation('/collections?tab=decks');
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Erreur lors de la suppression";
      toast({ title: errorMessage, variant: "destructive" });
    }
  });

  // Mutation pour mettre à jour le deck
  const updateDeckMutation = useMutation({
    mutationFn: async ({ name, themeColors, coverImage, bannerPosition }: { 
      name: string; 
      themeColors: string; 
      coverImage?: string | null; 
      bannerPosition?: number; 
    }) => {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, themeColors, coverImage, bannerPosition })
      });
      if (!response.ok) throw new Error('Failed to update deck');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
      setShowEditPanel(false);
    }
  });

  const handleSaveChanges = () => {
    updateDeckMutation.mutate({
      name: editName,
      themeColors: editTheme,
      coverImage: editCoverImage,
      bannerPosition: bannerPosition
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!deck) {
    queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
    
    return (
      <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
        <HaloBlur />
        <Header title="Deck" showBackButton />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Deck non trouvé</h1>
            <p className="text-gray-400">Ce deck n'existe pas ou a été supprimé.</p>
            <Button
              onClick={() => setLocation('/collections?tab=decks')}
              className="mt-4 bg-[hsl(9,69%,66%)] hover:bg-[hsl(9,69%,60%)] text-white"
            >
              Retour aux decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const themeGradient = themeOptions.find(t => t.value === deck.themeColors)?.gradient || "from-blue-900 to-blue-700";

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title="Deck" showBackButton />

      <div className="container mx-auto px-4 pb-20 pt-4">
        <div className="max-w-6xl mx-auto">
          <div className={cn(
            "rounded-2xl p-6 mb-6 relative overflow-hidden transition-all duration-300",
            `bg-gradient-to-br ${themeGradient}`
          )}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h1 className={cn(
                  "text-2xl font-bold font-luckiest mb-2",
                  deck.coverImage 
                    ? "text-white drop-shadow-lg" 
                    : ["white+sky", "white+red", "white+blue", "green+white"].includes(deck.themeColors) 
                      ? "text-black" 
                      : "text-white"
                )}>
                  {deck.name}
                </h1>
                <div className="text-sm">
                  <span className={cn(
                    deck.coverImage 
                      ? "text-white/90 drop-shadow-lg"
                      : ["white+sky", "white+red", "white+blue", "green+white"].includes(deck.themeColors) 
                        ? "text-black/80" 
                        : "text-white/80"
                  )}>
                    {localCards.length}/12 cartes
                  </span>
                </div>
              </div>

              {isOwnerView && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowEditPanel(true)}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    variant="outline"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    size="sm"
                    className="bg-red-500/80 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setShowSharePanel(true)}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Bannière avec thème (avec ou sans photo) */}
            <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
              {deck.coverImage ? (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${deck.coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: `center ${deck.bannerPosition || 50}%`
                  }}
                />
              ) : (
                <div className={cn(
                  "w-full h-full",
                  `bg-gradient-to-br ${themeGradient}`
                )} />
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {localCards.map((deckCard, index) => (
                <div 
                  key={`card-${deckCard.position}-${deckCard.card.id}`} 
                  className="relative group transition-all duration-200"
                >
                  <div className="relative">
                    {deckCard.type === 'collection' ? (
                      (deckCard.card as Card).imageUrl ? (
                        <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-lg">
                          <img 
                            src={(deckCard.card as Card).imageUrl ?? ''} 
                            alt={(deckCard.card as Card).playerName ?? 'Card'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <CardDisplay
                          card={deckCard.card as Card}
                          viewMode="grid"
                          variant="compact"
                        />
                      )
                    ) : (
                      (deckCard.card as PersonalCard).imageUrl ? (
                        <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-lg relative">
                          <img 
                            src={(deckCard.card as PersonalCard).imageUrl ?? ''} 
                            alt={(deckCard.card as PersonalCard).playerName ?? 'Card'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="text-white text-xs">
                              {(deckCard.card as PersonalCard).playerName}
                            </div>
                            <div className="text-xs opacity-80">
                              {(deckCard.card as PersonalCard).teamName}
                            </div>
                            <div className="text-xs opacity-60 mt-1">
                              {(deckCard.card as PersonalCard).cardType}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <CardDisplay
                          card={deckCard.card as Card}
                          viewMode="grid"
                          variant="compact"
                        />
                      )
                    )}
                    
                    {/* Contrôles mobile */}
                    {isOwnerView && (
                      <MobileCardControls
                        position={deckCard.position}
                        totalCards={localCards.length}
                        isSelected={focusedCard === deckCard.position}
                        onMoveLeft={() => moveCard(deckCard.position, deckCard.position - 1)}
                        onMoveRight={() => moveCard(deckCard.position, deckCard.position + 1)}
                        onDelete={() => removeCardMutation.mutate(deckCard.position)}
                        onToggleSelect={() => {
                          console.log('🔷 Toggle select called for position:', deckCard.position);
                          setFocusedCard(focusedCard === deckCard.position ? null : deckCard.position);
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: 12 - localCards.length }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-[2.5/3.5] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer group"
                  onClick={() => setLocation(`/create-deck?mode=add&deckId=${id}`)}
                >
                  <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                    <Plus className="w-8 h-8 mx-auto mb-1" />
                    <div className="text-xs text-center">Ajouter</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 max-w-md w-full mx-4 border border-[hsl(214,35%,30%)]">
            <h3 className="text-xl font-bold text-white mb-4">Supprimer le deck</h3>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement ce deck ? Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  deleteDeckMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteDeckMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteDeckMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}