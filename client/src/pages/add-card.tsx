import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Upload, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  
  // Form data - pour les cartes personnelles
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [cardType, setCardType] = useState("");
  const [reference, setReference] = useState("");
  const [numbering, setNumbering] = useState("");
  const [season, setSeason] = useState("");
  const [condition, setCondition] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleDescription, setSaleDescription] = useState("");
  const [isForSale, setIsForSale] = useState(false);
  
  // UI state
  const [showPlayerSuggestions, setShowPlayerSuggestions] = useState(false);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Types de cartes disponibles pour les cartes personnelles
  const cardTypes = [
    { type: "base", label: "Base" },
    { type: "base_numbered", label: "Base Numérotée" },
    { type: "insert", label: "Insert" },
    { type: "autograph", label: "Autographe" },
    { type: "numbered", label: "Numérotée" },
    { type: "special_1_1", label: "Spéciale 1/1" }
  ];

  // Fetch collections for selection
  const { data: collections = [] } = useQuery<any[]>({
    queryKey: ["/api/users/1/collections"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch cards from selected collection for player suggestions
  const { data: collectionCards = [] } = useQuery<any[]>({
    queryKey: [`/api/collections/${selectedCollectionId}/cards`],
    enabled: !!selectedCollectionId,
    select: (data: any) => {
      const cards = Array.isArray(data) ? data : (data?.cards || []);
      return cards;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all players including autographs and inserts
  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/cards/all"],
    select: (data: any[]) => {
      const playersMap = new Map();
      data?.forEach?.(card => {
        if (card.playerName && card.teamName) {
          const key = `${card.playerName}-${card.teamName}`;
          if (!playersMap.has(key)) {
            playersMap.set(key, {
              playerName: card.playerName,
              teamName: card.teamName,
              cardTypes: new Set()
            });
          }
          // Ajouter le type de carte pour ce joueur
          playersMap.get(key).cardTypes.add(card.cardType);
        }
      });
      // Convertir en array et inclure tous les types de cartes
      return Array.from(playersMap.values()).map(player => ({
        playerName: player.playerName,
        teamName: player.teamName,
        hasAutograph: player.cardTypes.has('Autographe Numbered') || 
                     player.cardTypes.has('Autographe Gold') ||
                     player.cardTypes.has('Autographe Red') ||
                     player.cardTypes.has('Autographe Silver'),
        hasInsert: Array.from(player.cardTypes).some(type => type.includes('Insert'))
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get players from selected collection or all players as fallback
  const playersForSuggestions = selectedCollectionId ? 
    collectionCards.map(card => ({
      playerName: card.playerName,
      teamName: card.teamName
    })).filter(player => player.playerName && player.teamName)
      .reduce((acc, player) => {
        const key = `${player.playerName}-${player.teamName}`;
        if (!acc.find(p => `${p.playerName}-${p.teamName}` === key)) {
          acc.push(player);
        }
        return acc;
      }, [] as Player[])
    : allPlayers;

  // Get unique teams from current player source
  const teamSet = new Set(playersForSuggestions.map(p => p.teamName));
  const allTeams = Array.from(teamSet).sort();

  // Filter players based on search
  const getPlayerSuggestions = () => {
    if (!playerName) return [];
    
    return playersForSuggestions.filter(player => {
      const nameMatch = player.playerName.toLowerCase().includes(playerName.toLowerCase());
      const teamMatch = !teamName || player.teamName.toLowerCase().includes(teamName.toLowerCase());
      return nameMatch && teamMatch;
    }).slice(0, 10);
  };

  // Filter teams
  const getTeamSuggestions = () => {
    if (!teamName) return [];
    
    return allTeams.filter(team =>
      team.toLowerCase().includes(teamName.toLowerCase())
    ).slice(0, 10);
  };

  // Add personal card mutation
  const addPersonalCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      console.log("Client: Sending card data to server:", cardData);
      const result = await apiRequest("POST", "/api/personal-cards", cardData);
      console.log("Client: Received response from server:", result);
      return result;
    },
    onSuccess: (newCard: any) => {
      console.log("Client: Card successfully added:", newCard);
      toast({
        title: "Carte ajoutée",
        description: "La carte a été ajoutée dans 'Mes cartes' !",
        className: "bg-green-600 text-white border-green-700"
      });
      
      // Invalidate all related cache keys to ensure fresh data
      console.log("Client: Invalidating cache keys...");
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      
      // Navigate back to collections page
      setLocation("/collections");
    },
    onError: (error: any) => {
      console.error("Client: Error adding personal card:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'ajouter la carte. Vérifie tes informations.",
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
        if (!cardType) return;
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
    if (!cardType) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un type de carte",
        variant: "destructive",
      });
      return;
    }

    const cardData = {
      playerName: playerName || null,
      teamName: teamName || null,
      cardType: cardType,
      reference: reference || null,
      numbering: numbering || null,
      season: season || null,
      imageUrl: editedImage || null,
      condition: condition || null,
      salePrice: isForSale ? salePrice : null,
      saleDescription: isForSale ? saleDescription : null,
      isForSale: isForSale,
      tradePrice: isForSale ? salePrice : null,
      tradeDescription: isForSale ? saleDescription : null,
      isForTrade: isForSale,
      tradeOnly: false,
    };

    console.log("Submitting card data:", cardData);
    addPersonalCardMutation.mutate(cardData);
  };

  const handleCancel = () => {
    setLocation("/collections");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-xl font-bold">Ajouter une carte</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center mb-8 space-x-4">
          {["import", "edit", "details", "confirmation"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step ? "bg-[hsl(9,85%,67%)] text-white" : 
                ["import", "edit", "details", "confirmation"].indexOf(currentStep) > index ? "bg-green-500 text-white" : "bg-zinc-700 text-zinc-400"
              }`}>
                {index + 1}
              </div>
              {index < 3 && <div className="w-12 h-1 bg-zinc-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "import" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Importer ta carte</h2>
            <p className="text-zinc-400 mb-8">Prends une photo ou importe une image de ta carte</p>
            
            <div className="space-y-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-8 py-3"
              >
                <Upload className="h-5 w-5 mr-2" />
                Choisir une image
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
        )}

        {currentStep === "edit" && editedImage && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Vérifier l'image</h2>
            <div className="mb-8 flex justify-center">
              <div className="w-80 h-96 bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden flex items-center justify-center">
                <img
                  src={editedImage}
                  alt="Card preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Retour
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {currentStep === "details" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Détails de la carte</h2>
            
            <div className="grid gap-6 max-w-2xl">
              {/* Collection pour l'autocomplétion */}
              <div>
                <Label htmlFor="collection" className="text-white mb-2 block">Collection (pour l'autocomplétion des joueurs)</Label>
                <Select value={selectedCollectionId?.toString() || ""} onValueChange={(value) => setSelectedCollectionId(value ? parseInt(value) : null)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Choisir une collection (optionnel)" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all" className="text-white hover:bg-zinc-700">
                      Toutes les collections
                    </SelectItem>
                    {collections.map((collection) => (
                      <SelectItem 
                        key={collection.id} 
                        value={collection.id.toString()}
                        className="text-white hover:bg-zinc-700"
                      >
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-zinc-400 mt-1">
                  Sélectionne une collection pour voir uniquement ses joueurs dans l'autocomplétion
                </p>
              </div>

              {/* Saison */}
              <div>
                <Label htmlFor="season" className="text-white mb-2 block">Saison</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Sélectionne la saison" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="22/23" className="text-white hover:bg-zinc-700">2022/23</SelectItem>
                    <SelectItem value="23/24" className="text-white hover:bg-zinc-700">2023/24</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type de carte */}
              <div>
                <Label htmlFor="cardType" className="text-white mb-2 block">Type de carte *</Label>
                <Select value={cardType} onValueChange={setCardType}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Sélectionne le type de carte" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {cardTypes.map((type) => (
                      <SelectItem 
                        key={type.type} 
                        value={type.type}
                        className="text-white hover:bg-zinc-700"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nom du joueur */}
              <div className="relative">
                <Label htmlFor="playerName" className="text-white mb-2 block">Nom du joueur</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setShowPlayerSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowPlayerSuggestions(playerName.length > 0)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: Kylian Mbappé"
                />
                {showPlayerSuggestions && getPlayerSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {getPlayerSuggestions().map((player, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-zinc-700 text-white"
                        onClick={() => {
                          setPlayerName(player.playerName);
                          setTeamName(player.teamName);
                          setShowPlayerSuggestions(false);
                        }}
                      >
                        <div className="font-medium">{player.playerName}</div>
                        <div className="text-sm text-zinc-400">{player.teamName}</div>
                        <div className="text-xs text-zinc-500 flex gap-2 mt-1">
                          {player.hasAutograph && <span className="bg-green-600 px-1 rounded">AUTO</span>}
                          {player.hasInsert && <span className="bg-orange-600 px-1 rounded">INSERT</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Équipe */}
              <div className="relative">
                <Label htmlFor="teamName" className="text-white mb-2 block">Équipe</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setShowTeamSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowTeamSuggestions(teamName.length > 0)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: Paris Saint-Germain"
                />
                {showTeamSuggestions && getTeamSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {getTeamSuggestions().map((team, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-zinc-700 text-white"
                        onClick={() => {
                          setTeamName(team);
                          setShowTeamSuggestions(false);
                        }}
                      >
                        {team}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Référence */}
              <div>
                <Label htmlFor="reference" className="text-white mb-2 block">Référence</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: #001"
                />
              </div>

              {/* Numérotation */}
              <div>
                <Label htmlFor="numbering" className="text-white mb-2 block">Numérotation</Label>
                <Input
                  id="numbering"
                  value={numbering}
                  onChange={(e) => setNumbering(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: 125/199"
                />
              </div>

              {/* État */}
              <div>
                <Label htmlFor="condition" className="text-white mb-2 block">État</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Sélectionne l'état" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="mint" className="text-white hover:bg-zinc-700">Mint</SelectItem>
                    <SelectItem value="near_mint" className="text-white hover:bg-zinc-700">Near Mint</SelectItem>
                    <SelectItem value="excellent" className="text-white hover:bg-zinc-700">Excellent</SelectItem>
                    <SelectItem value="good" className="text-white hover:bg-zinc-700">Bon</SelectItem>
                    <SelectItem value="played" className="text-white hover:bg-zinc-700">Usagé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prix de vente */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isForSale"
                    checked={isForSale}
                    onChange={(e) => setIsForSale(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isForSale" className="text-white">Carte à vendre</Label>
                </div>
                
                {isForSale && (
                  <>
                    <div>
                      <Label htmlFor="salePrice" className="text-white mb-2 block">Prix de vente (€)</Label>
                      <Input
                        id="salePrice"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Ex: 25.00"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saleDescription" className="text-white mb-2 block">Description de vente</Label>
                      <Input
                        id="saleDescription"
                        value={saleDescription}
                        onChange={(e) => setSaleDescription(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Description de la carte à vendre"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Retour
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!cardType}
                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white disabled:opacity-50"
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {currentStep === "confirmation" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Confirmer l'ajout</h2>
            
            <div className="bg-zinc-800 rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                {editedImage && (
                  <div className="flex justify-center">
                    <div className="w-64 h-80 bg-zinc-700 rounded-lg border border-zinc-600 overflow-hidden flex items-center justify-center">
                      <img
                        src={editedImage}
                        alt="Card preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Détails de la carte</h3>
                  {playerName && <p><span className="text-zinc-400">Joueur:</span> {playerName}</p>}
                  {teamName && <p><span className="text-zinc-400">Équipe:</span> {teamName}</p>}
                  <p><span className="text-zinc-400">Type:</span> {cardTypes.find(ct => ct.type === cardType)?.label}</p>
                  {season && <p><span className="text-zinc-400">Saison:</span> {season}</p>}
                  {reference && <p><span className="text-zinc-400">Référence:</span> {reference}</p>}
                  {numbering && <p><span className="text-zinc-400">Numérotation:</span> {numbering}</p>}
                  {condition && <p><span className="text-zinc-400">État:</span> {condition}</p>}
                  {isForSale && salePrice && <p><span className="text-zinc-400">Prix:</span> {salePrice}€</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Retour
              </Button>
              <Button
                onClick={handleSubmitCard}
                disabled={addPersonalCardMutation.isPending}
                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
              >
                {addPersonalCardMutation.isPending ? "Ajout en cours..." : "Ajouter la carte"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}