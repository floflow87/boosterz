import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Upload, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Collection {
  id: number;
  name: string;
  cardTypes?: Array<{
    type: string;
    label: string;
  }>;
}

interface Player {
  playerName: string;
  teamName: string;
}

type Step = "import" | "edit" | "details" | "confirmation";

export default function AddCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("import");
  
  // Form data
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [numbering, setNumbering] = useState("");
  
  // UI state
  const [showPlayerSuggestions, setShowPlayerSuggestions] = useState(false);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch collections with card types
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/users/1/collections"],
    select: (data: any[]) => {
      return data.map(collection => ({
        ...collection,
        cardTypes: [
          { type: "base", label: "Base" },
          { type: "base_numbered", label: "Base Numérotée" },
          { type: "insert", label: "Insert" },
          { type: "autograph", label: "Autographe" },
          { type: "numbered", label: "Numérotée" },
          { type: "special_1_1", label: "Spéciale 1/1" }
        ]
      }));
    }
  });

  // Fetch all players for suggestions - stable query
  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/cards/all"],
    select: (data: any[]) => {
      const playersMap = new Map();
      data?.forEach?.(card => {
        if (card.playerName && card.teamName) {
          const key = `${card.playerName}-${card.teamName}`;
          playersMap.set(key, {
            playerName: card.playerName,
            teamName: card.teamName
          });
        }
      });
      return Array.from(playersMap.values());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!collections.length
  });

  // Get unique teams
  const teamSet = new Set(allPlayers.map(p => p.teamName));
  const allTeams = Array.from(teamSet).sort();

  // Filter players based on search - no useEffect to avoid loops
  const getPlayerSuggestions = () => {
    if (!playerName) return [];
    
    return allPlayers.filter(player => {
      const matchesTeam = !teamName || player.teamName.toLowerCase().includes(teamName.toLowerCase());
      const matchesPlayer = player.playerName.toLowerCase().includes(playerName.toLowerCase());
      return matchesTeam && matchesPlayer;
    }).slice(0, 10);
  };

  // Get team suggestions
  const getTeamSuggestions = () => {
    if (!teamName) return allTeams.slice(0, 10);
    
    return allTeams.filter(team => 
      team.toLowerCase().includes(teamName.toLowerCase())
    ).slice(0, 10);
  };

  // Add card mutation
  const addCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      return apiRequest("POST", "/api/cards", cardData);
    },
    onSuccess: () => {
      toast({
        title: "Carte ajoutée",
        description: "La carte a été ajoutée avec succès à ta collection",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la carte. Vérifie tes informations.",
        variant: "destructive",
      });
    },
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setEditedImage(result);
        setCurrentStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case "import":
        if (!originalImage) return;
        setCurrentStep("edit");
        break;
      case "edit":
        setCurrentStep("details");
        break;
      case "details":
        if (!selectedCollectionId || !cardNumber) return;
        setCurrentStep("confirmation");
        break;
      case "confirmation":
        handleSubmitCard();
        break;
    }
  };

  const handlePrevStep = () => {
    switch (currentStep) {
      case "edit":
        setCurrentStep("import");
        break;
      case "details":
        setCurrentStep("edit");
        break;
      case "confirmation":
        setCurrentStep("details");
        break;
    }
  };

  const handleSubmitCard = async () => {
    if (!selectedCollectionId || !cardNumber) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const cardData = {
      collectionId: parseInt(selectedCollectionId),
      playerName: playerName || null,
      teamName: teamName || null,
      cardType: cardNumber,
      reference: `${cardNumber}-${Date.now()}`,
      numbering: numbering || null,
      imageUrl: editedImage || null,
      isOwned: true,
      isForTrade: false,
      cardSubType: null,
      isRookieCard: false,
      rarity: null,
      condition: null,
      tradeDescription: null,
      tradePrice: null,
      tradeOnly: false,
      salePrice: null,
      saleDescription: null,
      isSold: false,
      isFeatured: false
    };

    addCardMutation.mutate(cardData);
  };

  const selectedCollection = collections.find(c => c.id === parseInt(selectedCollectionId));

  const getStepTitle = () => {
    switch (currentStep) {
      case "import": return "Importer une photo";
      case "edit": return "Retoucher la photo";
      case "details": return "Détails de la carte";
      case "confirmation": return "Confirmation";
      default: return "Ajouter une carte";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold font-poppins">{getStepTitle()}</h1>
        </div>
        
        {/* Step Progress */}
        <div className="flex space-x-2">
          {["import", "edit", "details", "confirmation"].map((step, index) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                step === currentStep
                  ? "bg-[hsl(9,85%,67%)]"
                  : ["import", "edit", "details", "confirmation"].indexOf(currentStep) > index
                  ? "bg-green-500"
                  : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Import Step */}
        {currentStep === "import" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-400 mb-6">Sélectionne une photo de ta carte</p>
              
              <div className="space-y-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white py-4"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Importer une photo
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Step */}
        {currentStep === "edit" && editedImage && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <img
                src={editedImage}
                alt="Carte à éditer"
                className="w-full max-w-sm mx-auto rounded-lg"
              />
            </div>
            
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 border-gray-600 text-black hover:bg-gray-700 hover:text-white"
              >
                Retour
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white"
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Details Step */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Collection Selection */}
              <div className="space-y-2">
                <Label className="text-white">Collection *</Label>
                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionne une collection" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id.toString()}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Name with Suggestions */}
              <div className="space-y-2 relative">
                <Label className="text-white">Équipe</Label>
                <Input
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setShowTeamSuggestions(true);
                  }}
                  onFocus={() => setShowTeamSuggestions(true)}
                  placeholder="Ex: Olympique de Marseille"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                
                {/* Team Suggestions */}
                {showTeamSuggestions && getTeamSuggestions().length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto">
                    {getTeamSuggestions().map((team: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setTeamName(team);
                          setShowTeamSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white border-b border-gray-700 last:border-b-0"
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Player Name with Suggestions */}
              <div className="space-y-2 relative">
                <Label className="text-white">Nom du joueur *</Label>
                <Input
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setShowPlayerSuggestions(true);
                  }}
                  onFocus={() => setShowPlayerSuggestions(true)}
                  placeholder="Ex: Kylian Mbappé"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                
                {/* Player Suggestions */}
                {showPlayerSuggestions && getPlayerSuggestions().length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto">
                    {getPlayerSuggestions().map((player: Player, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setPlayerName(player.playerName);
                          setTeamName(player.teamName);
                          setShowPlayerSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white border-b border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium">{player.playerName}</div>
                        <div className="text-sm text-gray-400">{player.teamName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Type */}
              {selectedCollection && (
                <div className="space-y-2">
                  <Label className="text-white">Type de carte *</Label>
                  <Select value={cardNumber} onValueChange={setCardNumber}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Sélectionne le type de carte" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {selectedCollection.cardTypes?.map((cardType) => (
                        <SelectItem key={cardType.type} value={cardType.type}>
                          {cardType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Numbering */}
              <div className="space-y-2">
                <Label className="text-white">Numérotation</Label>
                <Input
                  value={numbering}
                  onChange={(e) => setNumbering(e.target.value)}
                  placeholder="Ex: /99, /199"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Click outside to close suggestions */}
            {(showPlayerSuggestions || showTeamSuggestions) && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => {
                  setShowPlayerSuggestions(false);
                  setShowTeamSuggestions(false);
                }}
              />
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 border-gray-600 text-black hover:bg-gray-700 hover:text-white"
              >
                Retour
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!selectedCollectionId || !cardNumber}
                className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white disabled:bg-gray-600"
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {currentStep === "confirmation" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white">Résumé de la carte</h3>
              
              {editedImage && (
                <img
                  src={editedImage}
                  alt="Aperçu de la carte"
                  className="w-32 h-44 object-cover rounded-lg mx-auto"
                />
              )}
              
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Collection:</span> {collections.find(c => c.id === parseInt(selectedCollectionId))?.name}</p>
                {teamName && <p><span className="text-gray-400">Équipe:</span> {teamName}</p>}
                {playerName && <p><span className="text-gray-400">Joueur:</span> {playerName}</p>}
                <p><span className="text-gray-400">Type:</span> {selectedCollection?.cardTypes?.find(ct => ct.type === cardNumber)?.label}</p>
                {numbering && <p><span className="text-gray-400">Numérotation:</span> {numbering}</p>}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 border-gray-600 text-black hover:bg-gray-700 hover:text-white"
              >
                Retour
              </Button>
              <Button
                onClick={handleSubmitCard}
                disabled={addCardMutation.isPending}
                className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white"
              >
                {addCardMutation.isPending ? "Ajout en cours..." : "Ajouter la carte"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}