import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Card } from "@shared/schema";

interface CardTradePanelProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardTradePanel({ card, isOpen, onClose }: CardTradePanelProps) {
  const [tradeDescription, setTradeDescription] = useState(card.tradeDescription || "");
  const [tradePrice, setTradePrice] = useState(card.tradePrice || "");
  const [tradeOnly, setTradeOnly] = useState(card.tradeOnly || false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTradeMutation = useMutation({
    mutationFn: async (tradeData: { tradeDescription: string; tradePrice: string; tradeOnly: boolean; isForTrade: boolean }) => {
      return apiRequest("POST", `/api/cards/${card.id}/trade`, tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${card.collectionId}/cards`] });
      toast({
        title: "Informations de trade mises à jour",
        description: "Les informations de trade ont été sauvegardées avec succès.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les informations de trade.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTradeMutation.mutate({
      tradeDescription,
      tradePrice,
      tradeOnly,
      isForTrade: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-xl p-6 z-50 border-t border-gray-700 shadow-2xl transform transition-transform duration-300 ease-out">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Informations de Trade</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-white font-medium">{card.playerName}</p>
          <p className="text-gray-400 text-sm">{card.teamName}</p>
          <p className="text-gray-400 text-sm">{card.cardType}</p>
          {card.numbering && (
            <p className="text-gray-400 text-sm">#{card.numbering}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-white mb-2 block">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre offre de trade..."
              value={tradeDescription}
              onChange={(e) => setTradeDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tradeOnly"
              checked={tradeOnly}
              onCheckedChange={(checked) => setTradeOnly(checked as boolean)}
            />
            <Label htmlFor="tradeOnly" className="text-white">
              Trade uniquement (pas de vente)
            </Label>
          </div>

          {!tradeOnly && (
            <div>
              <Label htmlFor="price" className="text-white mb-2 block">
                Prix indicatif (optionnel)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="price"
                  type="text"
                  placeholder="20€"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pl-10"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateTradeMutation.isPending}
              className="flex-1"
              style={{ backgroundColor: '#F37261' }}
            >
              {updateTradeMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}