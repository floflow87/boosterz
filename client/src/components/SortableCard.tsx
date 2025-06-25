import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
import { Trash2 } from "lucide-react";
import { Card } from '@/shared/schema';

interface PersonalCard {
  id: number;
  playerName: string;
  teamName: string;
}

interface DeckCard {
  position: number;
  type: 'collection' | 'personal';
  card: Card | PersonalCard;
}

interface SortableCardProps {
  id: string;
  cardData: DeckCard;
  index: number;
  isSelected: boolean;
  onLongPress: (position: number) => void;
  onRemove: (position: number) => void;
}

const SortableCard = ({ id, cardData, index, isSelected, onLongPress, onRemove }: SortableCardProps) => {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
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

  const card = cardData.type === 'collection' ? cardData.card as Card : cardData.card as PersonalCard;

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      onLongPress(cardData.position);
    }, 1000);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      onLongPress(cardData.position);
    }, 1000);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        aspect-[2.5/3.5] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg 
        border-2 p-3 transition-all duration-200 cursor-grab active:cursor-grabbing
        hover:shadow-lg hover:scale-105 relative
        ${isDragging ? 'opacity-50 shadow-2xl z-50' : ''}
        ${isSelected ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-gray-400'}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 rounded flex items-center justify-center relative">
        <span className="text-white font-bold text-center text-xs leading-tight">
          {card.playerName}
        </span>
        
        {/* Badge du type de carte */}
        <div className={`
          absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold
          ${cardData.type === 'collection' 
            ? 'bg-blue-500 text-white' 
            : 'bg-orange-500 text-white'
          }
        `}>
          {cardData.type === 'collection' ? 'BASE' : 'PERSO'}
        </div>
      </div>

      {/* Bouton de suppression pour sélection longue (mobile) */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(cardData.position);
          }}
          className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-20"
          style={{ pointerEvents: 'auto' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SortableCard;