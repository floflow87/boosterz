import { useState } from "react";
import { X, Camera, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Collection } from "@shared/schema";

interface CardAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  selectedCollection?: number;
}

export default function CardAddModal({ isOpen, onClose, collections, selectedCollection }: CardAddModalProps) {
  const [addMethod, setAddMethod] = useState<"photo" | "checklist">("photo");
  const [collection, setCollection] = useState<string>(selectedCollection?.toString() || "");
  const [cardNumber, setCardNumber] = useState("");
  const [playerName, setPlayerName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle card addition logic here
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[hsl(214,35%,11%)] z-50 overflow-y-auto">
      <div className="min-h-screen">
        <div className="flex items-center justify-between p-6 bg-[hsl(214,35%,22%)] border-b border-gray-600 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-white font-poppins">Ajouter une carte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 pb-20">
          {/* Add Method Selection */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setAddMethod("photo")}
              className={`flex-1 p-3 rounded-lg flex items-center justify-center space-x-2 ${
                addMethod === "photo" 
                  ? "bg-[hsl(9,85%,67%)] text-white" 
                  : "bg-[hsl(216,46%,13%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="font-poppins text-sm">Photo</span>
            </button>
            <button
              onClick={() => setAddMethod("checklist")}
              className={`flex-1 p-3 rounded-lg flex items-center justify-center space-x-2 ${
                addMethod === "checklist" 
                  ? "bg-[hsl(9,85%,67%)] text-white" 
                  : "bg-[hsl(216,46%,13%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="font-poppins text-sm">Checklist</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Collection Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2 font-poppins">
                Collection
              </label>
              <Select value={collection} onValueChange={setCollection}>
                <SelectTrigger className="w-full bg-[hsl(216,46%,13%)] border-gray-600 text-white">
                  <SelectValue placeholder="Sélectionner une collection" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(214,35%,22%)] border-gray-600">
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id.toString()} className="text-white">
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {addMethod === "photo" ? (
              <>
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2 font-poppins">
                    Photo de la carte
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4 font-poppins">
                      Prenez une photo ou sélectionnez depuis la galerie
                    </p>
                    <div className="flex space-x-2">
                      <Button type="button" className="flex-1 bg-[hsl(9,85%,67%)]">
                        <Camera className="w-4 h-4 mr-2" />
                        Appareil photo
                      </Button>
                      <Button type="button" variant="outline" className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Galerie
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Auto-detection info */}
                <div className="bg-[hsl(216,46%,13%)] rounded-lg p-3">
                  <p className="text-xs text-[hsl(212,23%,69%)] font-poppins">
                    L'application détectera automatiquement la carte et proposera un recentrage optimal.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Manual Card Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2 font-poppins">
                    Numéro de carte
                  </label>
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Ex: #001"
                    className="bg-[hsl(216,46%,13%)] border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 font-poppins">
                    Nom du joueur
                  </label>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ex: Mbappé"
                    className="bg-[hsl(216,46%,13%)] border-gray-600 text-white"
                  />
                </div>

                {/* Search suggestions */}
                <div className="bg-[hsl(216,46%,13%)] rounded-lg p-3">
                  <p className="text-xs text-[hsl(212,23%,69%)] mb-2 font-poppins">
                    Suggestions de la checklist:
                  </p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded bg-[hsl(214,35%,22%)] text-white text-sm hover:bg-[hsl(9,85%,67%)] transition-colors"
                    >
                      #001 - Mbappé (Paris SG)
                    </button>
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded bg-[hsl(214,35%,22%)] text-white text-sm hover:bg-[hsl(9,85%,67%)] transition-colors"
                    >
                      #002 - Neymar (Paris SG)
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
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
                className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)]"
              >
                Ajouter
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}