import { useState, useRef } from "react";
import { Camera, X, Upload } from "lucide-react";
import type { PersonalCard } from "@shared/schema";

interface EditCardModalProps {
  card: PersonalCard | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<PersonalCard>) => void;
}

export default function EditCardModal({ card, isOpen, onClose, onUpdate }: EditCardModalProps) {
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [cardType, setCardType] = useState("base");
  const [reference, setReference] = useState("");
  const [numbering, setNumbering] = useState("");
  const [season, setSeason] = useState("23/24");
  const [condition, setCondition] = useState("Mint");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when card prop changes
  useState(() => {
    if (card) {
      setPlayerName(card.playerName || "");
      setTeamName(card.teamName || "");
      setCardType(card.cardType || "base");
      setReference(card.reference || "");
      setNumbering(card.numbering || "");
      setSeason(card.season || "23/24");
      setCondition(card.condition || "Mint");
      setImageUrl(card.imageUrl || "");
      setImagePreview(card.imageUrl || null);
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) { // Limite 10MB
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Le fichier doit faire moins de 10MB");
    }
  };

  const handleSubmit = () => {
    const updates = {
      playerName: playerName.trim(),
      teamName: teamName.trim(),
      cardType,
      reference: reference.trim() || null,
      numbering: numbering.trim(),
      season,
      condition,
      imageUrl: imageUrl.trim() || undefined,
    };

    onUpdate(updates);
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Modifier la carte</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo de la carte */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Photo de la carte
            </label>
            <div className="flex flex-col gap-3">
              {imagePreview && (
                <div className="relative bg-slate-700 rounded-lg p-3">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                <Camera className="w-4 h-4" />
                {imagePreview ? "Changer la photo" : "Ajouter une photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Nom du joueur */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Nom du joueur
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Kylian Mbappé"
            />
          </div>

          {/* Équipe */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Équipe
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Paris Saint-Germain"
            />
          </div>

          {/* Type de carte */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Type de carte
            </label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="base">Base</option>
              <option value="insert">Insert</option>
              <option value="autograph">Autographe</option>
              <option value="rookie">Rookie</option>
              <option value="parallel">Parallèle</option>
            </select>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Référence (optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: #125"
            />
          </div>

          {/* Numérotation */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Numérotation
            </label>
            <input
              type="text"
              value={numbering}
              onChange={(e) => setNumbering(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 25/199 ou #001"
            />
          </div>

          {/* Saison */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Saison
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="22/23">22/23</option>
              <option value="23/24">23/24</option>
            </select>
          </div>

          {/* État */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              État
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Mint">Mint</option>
              <option value="Near Mint">Near Mint</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 p-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}