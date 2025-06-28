import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

interface MobileCardControlsProps {
  position: number;
  totalCards: number;
  isSelected: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
  onToggleSelect: () => void;
}

export default function MobileCardControls({
  position,
  totalCards,
  isSelected,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onToggleSelect
}: MobileCardControlsProps) {
  console.log('🎮 MobileCardControls render - position:', position, 'isSelected:', isSelected, 'totalCards:', totalCards);
  
  if (!isSelected) {
    return (
      <button
        onClick={onToggleSelect}
        className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10"
        title="Sélectionner pour modifier"
      >
        {position + 1}
      </button>
    );
  }

  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
      {position > 0 && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMoveLeft();
          }}
          className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-0 text-sm font-bold"
          size="sm"
          title="Déplacer vers la gauche"
        >
          <ArrowLeft className="h-3 w-3" />
        </Button>
      )}
      {position < totalCards - 1 && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMoveRight();
          }}
          className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-0 text-sm font-bold"
          size="sm"
          title="Déplacer vers la droite"
        >
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white rounded-full p-0"
        size="sm"
        title="Supprimer la carte"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}