import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, Camera, Search, Check, X, RotateCw, RefreshCw, Edit, Sun, Maximize, Contrast, Crop, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Card } from "@shared/schema";

interface CardPhotoImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (cardId: number, imageUrl: string) => void;
  availableCards: Card[];
  initialCard?: Card;
  currentFilter?: string;
}

export default function CardPhotoImportFixed({ isOpen, onClose, onImageUploaded, availableCards, initialCard, currentFilter }: CardPhotoImportProps) {
  const [step, setStep] = useState<"import" | "edit" | "assign">("import");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [recognizedCard, setRecognizedCard] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [showRetouchOptions, setShowRetouchOptions] = useState(false);
  const [selectedRetouchTool, setSelectedRetouchTool] = useState<string | null>(null);

  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    zoom: 100
  });

  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleClose = useCallback(() => {
    setStep("import");
    setSelectedImage(null);
    setOriginalImage(null);
    setPlayerName("");
    setCardNumber("");
    setRecognizedCard(null);
    setPlayerSuggestions([]);
    setShowSuggestions(false);
    setPlayerCards([]);
    setSelectedCardId(undefined);
    setShowRetouchOptions(false);
    setSelectedRetouchTool(null);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      zoom: 100
    });
    setImageHistory([]);
    setCurrentHistoryIndex(-1);
    onClose();
  }, [onClose]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        setOriginalImage(imageUrl);
        setImageHistory([imageUrl]);
        setCurrentHistoryIndex(0);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedImage || !selectedCardId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image et une carte.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Convertir l'image en base64 si ce n'est pas déjà fait
      const imageToSave = selectedImage.startsWith('data:') ? selectedImage : `data:image/jpeg;base64,${selectedImage}`;
      
      await onImageUploaded(selectedCardId, imageToSave);
      handleClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la photo. Vérifiez votre connexion.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, selectedCardId, onImageUploaded, toast, handleClose]);

  // Fonction utilitaire pour filtrer les cartes par catégorie
  const filterCardsByCategory = useCallback((cards: Card[]) => {
    if (!currentFilter) return cards;
    
    return cards.filter(card => {
      switch (currentFilter) {
        case "bases": 
          return card.cardType === "Base" || card.cardType === "Parallel Laser" || card.cardType === "Parallel Swirl";
        case "bases_numbered": 
          return card.cardType === "Parallel Numbered" && card.numbering !== "1/1";
        case "autographs": 
          return card.cardType === "Insert Autograph";
        case "hits": 
          return card.cardType === "Insert Autograph" || 
                 (card.cardType === "Parallel Numbered" && card.numbering === "1/1");
        case "special_1_1": 
          return card.cardType === "Parallel Numbered" && card.numbering === "1/1";
        default: 
          return true;
      }
    });
  }, [currentFilter]);

  const handlePlayerNameChange = useCallback((name: string) => {
    setPlayerName(name);
    
    if (name.trim().length >= 2) {
      const searchTerm = name.toLowerCase();
      const uniquePlayers = Array.from(new Set(availableCards.map(card => card.playerName).filter(Boolean))) as string[];
      const suggestions = uniquePlayers.filter(player => 
        player.toLowerCase().includes(searchTerm)
      ).slice(0, 5);
      
      // Filtrer les cartes par nom de joueur
      const matchingCards = availableCards.filter(card => 
        card.playerName && card.playerName.toLowerCase().includes(searchTerm)
      );

      // Appliquer le filtre de catégorie
      const filteredCards = filterCardsByCategory(matchingCards);
      
      setPlayerSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setPlayerCards(filteredCards);
      
      if (filteredCards.length > 0) {
        setSelectedCardId(filteredCards[0].id);
      } else {
        setSelectedCardId(undefined);
      }
    } else {
      setShowSuggestions(false);
      setPlayerSuggestions([]);
      setPlayerCards([]);
      setSelectedCardId(undefined);
    }
  }, [availableCards, filterCardsByCategory]);

  const performImageRecognition = useCallback(async (imageData: string) => {
    if (!imageData) return null;
    
    try {
      // Extraire le texte visible de l'image pour reconnaissance
      const response = await fetch('/api/recognize-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageData: imageData,
          availableCards: availableCards.map(card => ({
            id: card.id,
            playerName: card.playerName,
            teamName: card.teamName,
            cardType: card.cardType
          }))
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.log("Reconnaissance d'image non disponible, utilisation manuelle requise");
    }
    return null;
  }, [availableCards]);

  const handleNextFromEdit = useCallback(async () => {
    setIsProcessing(true);
    
    // Tenter la reconnaissance d'image
    if (selectedImage) {
      const recognition = await performImageRecognition(selectedImage);
      if (recognition && recognition.playerName) {
        setPlayerName(recognition.playerName);
        
        // Effectuer la recherche directement sans dépendance circulaire
        const searchTerm = recognition.playerName.toLowerCase();
        const uniquePlayers = Array.from(new Set(availableCards.map(card => card.playerName).filter(Boolean))) as string[];
        const suggestions = uniquePlayers.filter(player => 
          player.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        const matchingCards = availableCards.filter(card => 
          card.playerName && card.playerName.toLowerCase().includes(searchTerm)
        );
        const filteredCards = filterCardsByCategory(matchingCards);
        
        setPlayerSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
        setPlayerCards(filteredCards);
        
        if (filteredCards.length > 0) {
          setSelectedCardId(filteredCards[0].id);
        }
      }
    }
    
    setStep("assign");
    setIsProcessing(false);
  }, [selectedImage, performImageRecognition, availableCards, filterCardsByCategory]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPlayerName(suggestion);
    setShowSuggestions(false);
    setPlayerSuggestions([]);
    
    const searchTerm = suggestion.toLowerCase();
    const matchingCards = availableCards.filter(card => 
      card.playerName && card.playerName.toLowerCase() === searchTerm
    );
    setPlayerCards(matchingCards);
    
    if (matchingCards.length > 0) {
      setSelectedCardId(matchingCards[0].id);
    } else {
      // Recherche plus large si aucune correspondance exacte
      const partialMatchCards = availableCards.filter(card => 
        card.playerName && card.playerName.toLowerCase().includes(searchTerm)
      );
      setPlayerCards(partialMatchCards);
      if (partialMatchCards.length > 0) {
        setSelectedCardId(partialMatchCards[0].id);
      }
    }
  }, [availableCards]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto overflow-x-hidden bg-[hsl(240,3.7%,15.9%)] text-white p-0 border-gray-700 fixed">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {step === "import" && "Importer une photo"}
              {step === "edit" && "Retoucher la photo"}
              {step === "assign" && "Assigner à une carte"}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {step === "import" && "Sélectionnez une photo de carte à ajouter à votre collection"}
              {step === "edit" && "Ajustez et améliorez votre photo avant de l'assigner"}
              {step === "assign" && "Choisissez la carte correspondant à votre photo"}
            </DialogDescription>
          </DialogHeader>

          {/* Étape d'import */}
          {step === "import" && (
            <div className="space-y-6 px-6 pb-6">
              <div 
                className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-white mb-2">Cliquez pour importer une photo</p>
                <p className="text-gray-400 text-sm">Formats supportés: JPG, PNG, WEBP</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Étape d'édition */}
          {step === "edit" && selectedImage && (
            <div className="space-y-4 px-6 pb-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" ref={imageContainerRef}>
                    <img
                      ref={imageRef}
                      src={selectedImage}
                      alt="Photo à retoucher"
                      className="w-full h-auto object-contain max-h-[400px] transition-all duration-300"
                      style={{
                        filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
                        transform: `rotate(${adjustments.rotation}deg) scale(${adjustments.zoom / 100})`
                      }}
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRetouchOptions(!showRetouchOptions)} className="flex-1 text-black bg-white border-gray-300 hover:bg-gray-100">
                    <Edit className="h-4 w-4 mr-2" />
                    {showRetouchOptions ? "Masquer" : "Retoucher"}
                  </Button>
                  <Button onClick={handleNextFromEdit} className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isProcessing}>
                    <Search className="h-4 w-4 mr-2" />
                    Confirmer
                  </Button>
                </div>
              </div>

              {/* Interface de retouche */}
              {showRetouchOptions && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowRetouchOptions(false)}
                  />
                  
                  <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
                    <div className="py-4">
                      <div className="flex gap-6 overflow-x-auto px-6 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        
                        {/* Outil Luminosité */}
                        <div className="flex flex-col items-center gap-2 min-w-[60px]">
                          <Button
                            variant="ghost"
                            className={`w-12 h-12 rounded-full p-2 ${
                              selectedRetouchTool === 'brightness' 
                                ? 'bg-white text-black' 
                                : 'bg-transparent text-white hover:bg-white/20'
                            }`}
                            onClick={() => setSelectedRetouchTool(selectedRetouchTool === 'brightness' ? null : 'brightness')}
                          >
                            <Sun className="h-6 w-6" />
                          </Button>
                          <span className={`text-sm font-medium ${
                            selectedRetouchTool === 'brightness' ? 'text-white' : 'text-gray-300'
                          }`}>
                            Luminosité
                          </span>
                        </div>

                        {/* Outil Contraste */}
                        <div className="flex flex-col items-center gap-2 min-w-[60px]">
                          <Button
                            variant="ghost"
                            className={`w-12 h-12 rounded-full p-2 ${
                              selectedRetouchTool === 'contrast' 
                                ? 'bg-white text-black' 
                                : 'bg-transparent text-white hover:bg-white/20'
                            }`}
                            onClick={() => setSelectedRetouchTool(selectedRetouchTool === 'contrast' ? null : 'contrast')}
                          >
                            <Contrast className="h-6 w-6" />
                          </Button>
                          <span className={`text-sm font-medium ${
                            selectedRetouchTool === 'contrast' ? 'text-white' : 'text-gray-300'
                          }`}>
                            Contraste
                          </span>
                        </div>

                        {/* Outil Rotation */}
                        <div className="flex flex-col items-center gap-2 min-w-[60px]">
                          <Button
                            variant="ghost"
                            className={`w-12 h-12 rounded-full p-2 ${
                              selectedRetouchTool === 'rotation' 
                                ? 'bg-white text-black' 
                                : 'bg-transparent text-white hover:bg-white/20'
                            }`}
                            onClick={() => setSelectedRetouchTool(selectedRetouchTool === 'rotation' ? null : 'rotation')}
                          >
                            <RotateCw className="h-6 w-6" />
                          </Button>
                          <span className={`text-sm font-medium ${
                            selectedRetouchTool === 'rotation' ? 'text-white' : 'text-gray-300'
                          }`}>
                            Rotation
                          </span>
                        </div>

                        {/* Outil Recadrer */}
                        <div className="flex flex-col items-center gap-2 min-w-[60px]">
                          <Button
                            variant="ghost"
                            className={`w-12 h-12 rounded-full p-2 ${
                              selectedRetouchTool === 'crop' 
                                ? 'bg-white text-black' 
                                : 'bg-transparent text-white hover:bg-white/20'
                            }`}
                            onClick={() => setSelectedRetouchTool(selectedRetouchTool === 'crop' ? null : 'crop')}
                          >
                            <Crop className="h-6 w-6" />
                          </Button>
                          <span className={`text-sm font-medium ${
                            selectedRetouchTool === 'crop' ? 'text-white' : 'text-gray-300'
                          }`}>
                            Recadrer
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Panneau de réglage */}
                    {selectedRetouchTool && (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mx-6 mb-4">
                        {selectedRetouchTool === 'brightness' && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white font-medium">Luminosité</span>
                              <span className="text-gray-400 text-sm">{adjustments.brightness}%</span>
                            </div>
                            <Slider
                              value={[adjustments.brightness]}
                              onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                              min={50}
                              max={150}
                              step={5}
                              className="w-full mb-3"
                            />
                          </div>
                        )}

                        {selectedRetouchTool === 'contrast' && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white font-medium">Contraste</span>
                              <span className="text-gray-400 text-sm">{adjustments.contrast}%</span>
                            </div>
                            <Slider
                              value={[adjustments.contrast]}
                              onValueChange={([value]) => setAdjustments(prev => ({ ...prev, contrast: value }))}
                              min={50}
                              max={150}
                              step={5}
                              className="w-full mb-3"
                            />
                          </div>
                        )}

                        {selectedRetouchTool === 'rotation' && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white font-medium">Rotation</span>
                              <span className="text-gray-400 text-sm">{adjustments.rotation}°</span>
                            </div>
                            <div className="flex gap-2 justify-center mb-3">
                              <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 0 }))} className="text-black bg-white">
                                0°
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 90 }))} className="text-black bg-white">
                                90°
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 180 }))} className="text-black bg-white">
                                180°
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 270 }))} className="text-black bg-white">
                                270°
                              </Button>
                            </div>
                            <Slider
                              value={[adjustments.rotation]}
                              onValueChange={([value]) => setAdjustments(prev => ({ ...prev, rotation: value }))}
                              min={0}
                              max={360}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}

                        {selectedRetouchTool === 'crop' && (
                          <div>
                            <div className="mb-3">
                              <span className="text-white font-medium">Recadrage</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAdjustments(prev => ({ ...prev, zoom: 120 }))}
                                className="text-black bg-white"
                              >
                                Carré
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAdjustments(prev => ({ ...prev, zoom: 110 }))}
                                className="text-black bg-white"
                              >
                                Portrait
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAdjustments(prev => ({ ...prev, zoom: 100 }))}
                                className="text-black bg-white"
                              >
                                Original
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAdjustments(prev => ({ ...prev, zoom: 130 }))}
                                className="text-black bg-white"
                              >
                                Zoom
                              </Button>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white font-medium">Zoom</span>
                              <span className="text-gray-400 text-sm">{adjustments.zoom}%</span>
                            </div>
                            <Slider
                              value={[adjustments.zoom]}
                              onValueChange={([value]) => setAdjustments(prev => ({ ...prev, zoom: value }))}
                              min={50}
                              max={200}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Étape d'assignation */}
          {step === "assign" && (
            <div className="space-y-4 px-6 pb-6">
              <div className="space-y-4">
                {selectedImage && (
                  <div className="mb-4 text-center">
                    <div className="w-56 h-72 mx-auto relative">
                      <img
                        src={selectedImage}
                        alt="Photo importée"
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-600 transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-1">
                      Nom du joueur
                    </label>
                    <div className="relative">
                      <Input
                        value={playerName}
                        onChange={(e) => handlePlayerNameChange(e.target.value)}
                        onFocus={() => setShowSuggestions(playerSuggestions.length > 0)}
                        placeholder="Commencez à taper le nom du joueur..."
                        className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                      />
                      {playerName && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlayerName("");
                            setPlayerCards([]);
                            setSelectedCardId(undefined);
                            setShowSuggestions(false);
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {showSuggestions && playerSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                        {playerSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {playerCards.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Carte ({playerCards.length} carte(s) trouvée(s))
                      </label>
                      <Select value={selectedCardId?.toString()} onValueChange={(value) => setSelectedCardId(parseInt(value))}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Sélectionner une carte" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {playerCards.map((card) => (
                            <SelectItem key={card.id} value={card.id.toString()} className="text-white hover:bg-gray-700">
                              #{card.reference} - {card.playerName || 'Nom inconnu'} ({card.teamName || 'Équipe inconnue'}) - {card.cardType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {playerCards.length === 0 && playerName && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                      <p className="text-yellow-300 text-sm">
                        Aucune carte trouvée pour "{playerName}". Vérifiez l'orthographe ou ajoutez d'abord la carte à votre collection.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("edit")} className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  Retour
                </Button>
                <Button onClick={handleSave} disabled={!selectedCardId || isProcessing} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}