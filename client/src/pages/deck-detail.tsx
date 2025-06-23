import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Trash2, Share2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Deck, Card, PersonalCard } from "@shared/schema";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
import { Button } from "@/components/ui/button";
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

interface DeckWithCards extends Deck {
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
}

function SortableCard({ id, cardData, index }: SortableCardProps) {
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
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50 z-50"
      )}
      {...attributes}
    >
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center z-10">
        {index + 1}
      </div>
      
      {/* Handle de drag */}
      <div 
        className="absolute top-2 right-2 bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {cardData.type === 'collection' ? (
        (cardData.card as Card).imageUrl ? (
          <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-lg">
            <img 
              src={(cardData.card as Card).imageUrl} 
              alt={(cardData.card as Card).playerName}
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
  "navy+gold": {
    backgroundColor: "#000080",
    accentColor: "#FFD700",
    gradientClass: "bg-gradient-radial from-blue-900 via-blue-900 to-yellow-500"
  },
  "red": {
    backgroundColor: "#DC2626",
    accentColor: "#FFFFFF",
    gradientClass: "bg-gradient-radial from-red-600 via-red-600 to-white"
  },
  "white+blue": {
    backgroundColor: "#FFFFFF",
    accentColor: "#3B82F6",
    gradientClass: "bg-gradient-radial from-white via-white to-blue-500"
  }
};

export default function DeckDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: deck, isLoading } = useQuery<DeckWithCards>({
    queryKey: [`/api/decks/${id}`],
    enabled: !!id,
  });

  const [localCards, setLocalCards] = useState<DeckWithCards['cards']>([]);

  // useEffect pour synchroniser les cartes locales
  useEffect(() => {
    if (deck?.cards) {
      setLocalCards([...deck.cards]);
    }
  }, [deck?.cards]);

  // Configuration des capteurs pour le drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
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
    return (
      <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
        <HaloBlur />
        <Header title="Deck" showBackButton />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
        <HaloBlur />
        <Header title="Deck" showBackButton />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">Deck non trouvé</div>
        </div>
      </div>
    );
  }

  const themeStyle = themeStyles[deck.themeColors as keyof typeof themeStyles] || themeStyles["main+background"];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title={deck.name} showBackButton />
      
      <main className="relative z-10 px-4 pb-24 pt-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Deck Header */}
          <div 
            className={cn(
              "rounded-2xl p-6 mb-6",
              themeStyle.gradientClass
            )}
            style={{
              borderColor: themeStyle.accentColor
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white font-luckiest mb-2">
                  {deck.name}
                </h1>
                <div className="text-sm">
                  <span className="text-white/80">
                    {deck.cardCount} carte{deck.cardCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-2"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-2"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Cover Image */}
            {deck.coverImage && (
              <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
                <img 
                  src={deck.coverImage} 
                  alt={`Couverture de ${deck.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Cartes du deck ({deck.cardCount}/12)
              </h2>
            </div>

            {localCards.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  Ce deck ne contient pas encore de cartes.
                </div>
                <Button
                  onClick={() => setLocation(`/create-deck`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Ajouter des cartes
                </Button>
              </div>
            ) : (
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
                      />
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({ length: 12 - localCards.length }, (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="aspect-[2.5/3.5] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
                      >
                        <div className="text-gray-500 text-xs text-center">
                          Emplacement<br />libre
                        </div>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>


        </div>
      </main>
    </div>
  );
}