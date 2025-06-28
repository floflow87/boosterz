import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Plus, Check, HelpCircle, Grid, List, X, Search, Trash2, Camera, CheckSquare, Square, Users, ChevronLeft, ChevronRight, Minus, Handshake, MoreVertical, Star } from "lucide-react";
import Navigation from "@/components/navigation";
import CardPhotoImportFixed from "@/components/card-photo-import-fixed";
import CardTradePanel from "@/components/card-trade-panel";
import LoadingScreen from "@/components/LoadingScreen";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Card } from "@shared/schema";
import logoImage from "@assets/image 29_1750317707391.png";
import cardDefaultImage from "@assets/f455cf2a-3d9e-456f-a921-3ac0c4507202_1750348552823.png";

export default function CollectionDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const collectionId = params.id ? parseInt(params.id) : 1;
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "bases" | "autographs" | "hits" | "special_1_1">("bases");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [selectedTradeCard, setSelectedTradeCard] = useState<Card | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Simplified component return
  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white overflow-x-hidden relative">
      <HaloBlur />
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(216,46%,13%)] border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation('/collections')}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Collection Details</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Collection en cours de réparation</h2>
          <p className="text-gray-400 mb-6">La page de collection est en cours de maintenance pour corriger les erreurs de syntaxe.</p>
          <button
            onClick={() => setLocation('/home')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <CardPhotoImportFixed
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        preselectedPlayer={selectedCard?.playerName || undefined}
        onImageUploaded={async (cardId, imageUrl) => {
          console.log("Image uploaded:", cardId, imageUrl);
          setShowPhotoUpload(false);
        }}
        availableCards={[]}
        currentFilter={filter}
      />

      {/* Trade Panel Modal */}
      {selectedTradeCard && (
        <CardTradePanel
          card={selectedTradeCard}
          isOpen={showTradePanel}
          onClose={() => {
            setShowTradePanel(false);
            setSelectedTradeCard(null);
          }}
        />
      )}

      <Navigation />
    </div>
  );
}