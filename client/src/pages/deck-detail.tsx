import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Trash2, Share2, Eye, EyeOff, GripVertical, Plus, X, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Deck, Card, PersonalCard } from "@shared/schema";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
import LoadingScreen from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { apiRequest } from "@/lib/queryClient";

interface DeckWithCards extends Omit<Deck, 'bannerPosition'> {
  bannerPosition?: number | null;
  cards: Array<{
    type: 'collection' | 'personal';
    card: Card | PersonalCard;
    position: number;
  }>;
}

// Composant pour les cartes triables
interface SortableCardProps {
  id: string;
  cardData: {
    type: 'collection' | 'personal';
    card: Card | PersonalCard;
    position: number;
  };
  index: number;
  onRemove: (position: number) => void;
  isSelected: boolean;
  onLongPress: (position: number) => void;
}

function SortableCard({ id, cardData, index, onRemove, isSelected, onLongPress }: SortableCardProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Pas de transition pendant le drag
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-transform duration-200 ease-out",
        isDragging && "opacity-75 scale-105 rotate-2 shadow-2xl z-50"
      )}
      {...attributes}
    >
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center z-10">
        {index + 1}
      </div>
      
      {/* Handle de drag */}
      <div 
        className="absolute top-2 right-2 bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing hover:bg-black/90 hover:scale-110 z-10"
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {cardData.type === 'collection' ? (
        (cardData.card as Card).imageUrl ? (
          <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-lg">
            <img 
              src={(cardData.card as Card).imageUrl ?? ''} 
              alt={(cardData.card as Card).playerName ?? 'Card'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <CardDisplay
            card={cardData.card as Card}
            viewMode="grid"
            variant="compact"
          />
        )
      ) : (
        (cardData.card as PersonalCard).imageUrl ? (
          <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-lg relative">
            <img 
              src={(cardData.card as PersonalCard).imageUrl ?? ''} 
              alt={(cardData.card as PersonalCard).playerName ?? 'Card'}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="text-white text-xs">
                <div className="font-bold">{(cardData.card as PersonalCard).playerName}</div>
                <div className="opacity-80">{(cardData.card as PersonalCard).teamName}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[2.5/3.5] bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs text-center p-2">
            <div>
              <div className="font-bold text-sm mb-1">
                {(cardData.card as PersonalCard).playerName}
              </div>
              <div className="text-xs opacity-80">
                {(cardData.card as PersonalCard).teamName}
              </div>
              <div className="text-xs opacity-60 mt-1">
                {(cardData.card as PersonalCard).cardType}
              </div>
            </div>
          </div>
        )
      )}
      
      {/* Bouton poubelle qui apparaît lors du long press */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(cardData.position);
          }}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg z-20 animate-pulse"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
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
  }
};

export default function DeckDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const parallaxRef = useRef<HTMLDivElement>(null);
  
  const { data: deck, isLoading } = useQuery<DeckWithCards>({
    queryKey: [`/api/decks/${id}`],
    enabled: !!id,
  });

  const [localCards, setLocalCards] = useState<DeckWithCards['cards']>([]);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [selectedCardToDelete, setSelectedCardToDelete] = useState<number | null>(null);
  const [longPressCard, setLongPressCard] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editCoverImage, setEditCoverImage] = useState<string | null>(null);
  const [bannerPosition, setBannerPosition] = useState(50); // Position verticale en %
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // useEffect pour synchroniser les cartes locales et initialiser l'édition
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

  // Effet parallax sur l'image de bannière (décalé)
  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.3; // Réduction de l'intensité
        parallaxRef.current.style.transform = `translateY(${parallax + 20}px)`; // Décalage initial
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Synchroniser bannerPosition quand le deck change
  useEffect(() => {
    if (deck?.bannerPosition !== undefined) {
      setBannerPosition(deck.bannerPosition);
    }
  }, [deck]);

  // Configuration des capteurs pour le drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Réduction de la distance pour plus de réactivité
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation pour sauvegarder les nouvelles positions
  const updatePositionsMutation = useMutation({
    mutationFn: async (newPositions: Array<{ cardId?: number; personalCardId?: number; position: number }>) => {
      const response = await fetch(`/api/decks/${id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: newPositions })
      });
      if (!response.ok) throw new Error('Failed to update positions');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
    }
  });

  // Mutation pour supprimer le deck
  const deleteDeckMutation = useMutation({
    mutationFn: async () => {
      console.log(`Deleting deck with ID: ${id}`);
      const response = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete error:', errorData);
        if (response.status === 404) {
          throw new Error('Ce deck a déjà été supprimé');
        }
        throw new Error('Erreur lors de la suppression');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Delete successful:', data);
      toast({ 
        title: "Deck supprimé avec succès!",
        className: "bg-green-600 text-white border-green-700"
      });
      // Invalider les requêtes pour forcer le rechargement
      queryClient.invalidateQueries({ queryKey: ['/api/decks'] });
      queryClient.removeQueries({ queryKey: [`/api/decks/${id}`] });
      setLocation('/collections?tab=decks');
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      const errorMessage = error.message || "Erreur lors de la suppression";
      toast({ title: errorMessage, variant: "destructive" });
      
      // Si le deck n'existe plus, rediriger quand même
      if (error.message === 'Ce deck a déjà été supprimé') {
        setTimeout(() => {
          setLocation('/collections?tab=decks');
        }, 2000);
      }
    }
  });

  // Mutation pour sauvegarder les modifications du deck
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

  // Gestionnaire de fin de drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localCards.findIndex(card => `${card.type}-${card.type === 'collection' ? (card.card as Card).id : (card.card as PersonalCard).id}` === active.id);
    const newIndex = localCards.findIndex(card => `${card.type}-${card.type === 'collection' ? (card.card as Card).id : (card.card as PersonalCard).id}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCards = arrayMove(localCards, oldIndex, newIndex);
      
      // Mettre à jour les positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: index
      }));

      setLocalCards(updatedCards);

      // Préparer les données pour l'API
      const newPositions = updatedCards.map((card, index) => ({
        cardId: card.type === 'collection' ? (card.card as Card).id : undefined,
        personalCardId: card.type === 'personal' ? (card.card as PersonalCard).id : undefined,
        position: index
      }));

      // Sauvegarder les nouvelles positions
      updatePositionsMutation.mutate(newPositions);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!deck) {
    // Invalider le cache des decks pour qu'ils se rechargent
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

  const themeStyle = themeStyles[deck.themeColors as keyof typeof themeStyles] || themeStyles["main+background"];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header 
        title={deck.name} 
        showBackButton 
        onBack={() => setLocation('/collections?tab=decks')}
      />
      
      <main className="relative z-10 px-4 pb-24 pt-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Deck Header */}
          <div 
            className={cn(
              "rounded-2xl p-6 mb-6 relative overflow-hidden",
              themeStyle.gradientClass
            )}
            style={{
              borderColor: themeStyle.accentColor
            }}
          >
            {/* Background Cover Image with Parallax */}
            {deck.coverImage && (
              <>
                <div 
                  ref={parallaxRef}
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-75"
                  style={{
                    backgroundImage: `url(${deck.coverImage})`,
                    backgroundPosition: `center ${deck.bannerPosition || 50}%`,
                    transform: 'translateY(20px)'
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Halos scintillants pour deck complet */}
                {localCards.length === 12 && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-radial from-yellow-300 via-orange-300 to-transparent rounded-full opacity-60"
                        style={{
                          left: `${5 + Math.random() * 90}%`,
                          top: `${5 + Math.random() * 90}%`,
                          animation: `gentle-twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
                          animationDelay: `${Math.random() * 6}s`,
                          boxShadow: '0 0 8px rgba(251, 191, 36, 0.6), 0 0 12px rgba(251, 191, 36, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
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
              
              <div className="flex gap-2 relative z-10">

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2",
                    deck.coverImage
                      ? "text-white hover:bg-white/20 backdrop-blur-sm"
                      : ["white+sky", "white+red", "white+blue", "green+white"].includes(deck.themeColors)
                        ? "text-black hover:bg-black/10"
                        : "text-white hover:bg-white/10"
                  )}
                  onClick={() => setShowSharePanel(true)}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2",
                    deck.coverImage
                      ? "text-white hover:bg-white/20 backdrop-blur-sm"
                      : ["white+sky", "white+red", "white+blue", "green+white"].includes(deck.themeColors)
                        ? "text-black hover:bg-black/10"
                        : "text-white hover:bg-white/10"
                  )}
                  onClick={() => setShowEditPanel(true)}
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2",
                    deck.coverImage
                      ? "text-white hover:bg-red-500/20 backdrop-blur-sm"
                      : ["white+sky", "white+red", "white+blue", "green+white"].includes(deck.themeColors)
                        ? "text-black hover:bg-red-500/10"
                        : "text-white hover:bg-red-500/10"
                  )}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Cover Image */}
            {deck.coverImage && (
              <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${deck.coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: `center ${deck.bannerPosition || 50}%`
                  }}
                />
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="space-y-4">

            {/* Grille des cartes avec emplacements vides */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localCards.map(card => `${card.type}-${card.type === 'collection' ? (card.card as Card).id : (card.card as PersonalCard).id}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {localCards.map((deckCard, index) => (
                    <SortableCard
                      key={`${deckCard.type}-${deckCard.type === 'collection' ? (deckCard.card as Card).id : (deckCard.card as PersonalCard).id}`}
                      id={`${deckCard.type}-${deckCard.type === 'collection' ? (deckCard.card as Card).id : (deckCard.card as PersonalCard).id}`}
                      cardData={deckCard}
                      index={index}
                      isSelected={longPressCard === deckCard.position}
                      onLongPress={(position) => {
                        setLongPressCard(position);
                      }}
                      onRemove={(position) => {
                        // Supprimer la carte
                        const newCards = localCards.filter(c => c.position !== position);
                        const reorderedCards = newCards.map((c, index) => ({ ...c, position: index }));
                        setLocalCards(reorderedCards);
                        
                        // Toast de succès
                        toast({
                          title: "Carte supprimée",
                          description: "La carte a été retirée du deck avec succès",
                          className: "bg-green-600 text-white border-green-600",
                        });
                        
                        // Réinitialiser la sélection
                        setLongPressCard(null);
                        
                        // Invalider le cache
                        queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
                      }}
                    />
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
                        <div className="text-xs text-center">
                          + ajouter
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>


        </div>
      </main>

      {/* Panel d'édition avec fond fixe */}
      {showEditPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="sticky top-0 bg-[hsl(214,35%,22%)] p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Modifier le deck</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setShowEditPanel(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <Label htmlFor="deck-name" className="text-white mb-2 block">
                  Nom du deck
                </Label>
                <Input
                  id="deck-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[hsl(214,35%,15%)] border-gray-600 text-white"
                  placeholder="Nom du deck"
                />
              </div>

              {/* Banner Section */}
              <div>
                <Label className="text-white mb-3 block">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Bannière du deck
                </Label>
                
                {/* Banner Preview and Upload */}
                <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4 mb-4">
                  {editCoverImage ? (
                    <div className="relative">
                      <div 
                        className="w-full h-32 rounded-lg overflow-hidden relative bg-gray-800"
                        style={{
                          backgroundImage: `url(${editCoverImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: `center ${bannerPosition}%`
                        }}
                      >
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                            Aperçu
                          </span>
                        </div>
                      </div>
                      
                      {/* Position Control */}
                      <div className="mt-3">
                        <Label className="text-white text-sm mb-2 block">
                          Position verticale: {bannerPosition}%
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={bannerPosition}
                          onChange={(e) => setBannerPosition(Number(e.target.value))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      
                      <button
                        onClick={() => setEditCoverImage(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEditCoverImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="bannerUpload"
                      />
                      <label
                        htmlFor="bannerUpload"
                        className="cursor-pointer border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-sm">Ajouter une bannière</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className="w-full flex items-center justify-between p-3 bg-[hsl(214,35%,18%)] rounded-lg border border-gray-600 hover:border-gray-500 transition-colors mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn("w-8 h-8 rounded", themeStyles[editTheme as keyof typeof themeStyles]?.gradientClass || themeStyles["main+background"].gradientClass)}
                    />
                    <div>
                      <Label className="text-white text-sm font-medium">Thème</Label>
                      <div className="text-gray-400 text-xs">
                        {editTheme === "main+background" && "Défaut"}
                        {editTheme === "white+sky" && "Blanc & Ciel"}
                        {editTheme === "red+navy" && "Rouge & Marine"}
                        {editTheme === "navy+bronze" && "Marine & Bronze"}
                        {editTheme === "white+red" && "Blanc & Rouge"}
                        {editTheme === "white+blue" && "Blanc & Bleu"}
                        {editTheme === "gold+black" && "Or & Noir"}
                        {editTheme === "green+white" && "Vert & Blanc"}
                        {editTheme === "red+black" && "Rouge & Noir"}
                        {editTheme === "blue+white+red" && "Bleu Blanc Rouge"}
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
                          setEditTheme(key);
                          setShowThemeSelector(false);
                        }}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          editTheme === key
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
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600 text-black hover:bg-white/10"
                  onClick={() => setShowEditPanel(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => updateDeckMutation.mutate({ 
                    name: editName, 
                    themeColors: editTheme,
                    coverImage: editCoverImage,
                    bannerPosition 
                  })}
                  disabled={updateDeckMutation.isPending}
                >
                  {updateDeckMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de partage */}
      {showSharePanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-[hsl(214,35%,22%)] rounded-t-2xl w-full max-w-md mx-auto p-6 animate-in slide-in-from-bottom-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Partager le deck</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setShowSharePanel(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-gray-300 mb-4">
                  Partage ton deck avec la communauté !
                </div>
                
                <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-400 mb-2">Lien de partage :</div>
                  <div className="text-white text-sm font-mono bg-black/30 rounded p-2 break-all">
                    {window.location.href}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-black hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // Toast notification could be added here
                    }}
                  >
                    Copier le lien
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-black hover:bg-white/10"
                    onClick={() => {
                      const text = `Découvre mon deck "${deck?.name}" sur BOOSTERZ ! ${window.location.href}`;
                      if (navigator.share) {
                        navigator.share({ title: deck?.name, text, url: window.location.href });
                      }
                    }}
                  >
                    Partager
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  console.log('Delete button clicked, mutating...');
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