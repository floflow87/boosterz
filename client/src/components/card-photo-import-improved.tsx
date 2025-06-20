import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, Image, X, RotateCw, Sun, Contrast, Droplets, CircleDot, Check, Search, Edit, Crop, RefreshCw, Download, Maximize, ZoomIn, ZoomOut, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface CardPhotoImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string, cardId?: number) => void;
  availableCards: Array<{ id: number; cardNumber: string; playerName: string; teamName: string; cardType: string; collectionId: number; }>;
  preselectedCard?: { id: number; playerName: string; reference: string; teamName: string; };
  currentFilter?: string;
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  zoom: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageHistory {
  image: string;
  adjustments: ImageAdjustments;
  timestamp: number;
}

export default function CardPhotoImportImproved({ isOpen, onClose, onSave, availableCards, preselectedCard, currentFilter }: CardPhotoImportProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"import" | "edit" | "assign">("import");
  const [showRetouchOptions, setShowRetouchOptions] = useState(false);
  const [selectedRetouchTool, setSelectedRetouchTool] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<ImageHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedCard, setRecognizedCard] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>(preselectedCard?.id);
  const [playerName, setPlayerName] = useState<string>(preselectedCard?.playerName || "");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [playerCards, setPlayerCards] = useState<Array<{ id: number; cardNumber: string; playerName: string; teamName: string; cardType: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    zoom: 100,
    crop: { x: 0, y: 0, width: 100, height: 100 }
  });
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation de la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximale : 10MB");
        return;
      }

      // Validation du type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert("Format non supporté. Utilisez JPG, PNG ou WEBP");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setSelectedImage(result);
          setOriginalImage(result);
          
          // Ajouter à l'historique
          const historyEntry: ImageHistory = {
            image: result,
            adjustments: {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              rotation: 0,
              zoom: 100,
              crop: { x: 0, y: 0, width: 100, height: 100 }
            },
            timestamp: Date.now()
          };
          setImageHistory([historyEntry]);
          setCurrentHistoryIndex(0);
        }
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleImportOption = useCallback((option: string) => {
    switch (option) {
      case "gallery":
        if (galleryInputRef.current) galleryInputRef.current.click();
        break;
      case "file":
        if (fileInputRef.current) fileInputRef.current.click();
        break;
      case "camera":
        if (cameraInputRef.current) cameraInputRef.current.click();
        break;
    }
  }, []);

  const addToHistory = useCallback((image: string, adjustments: ImageAdjustments) => {
    const historyEntry: ImageHistory = {
      image,
      adjustments,
      timestamp: Date.now()
    };
    
    setImageHistory(prev => {
      const newHistory = [...prev.slice(0, currentHistoryIndex + 1), historyEntry];
      return newHistory.slice(-10); // Garder seulement les 10 dernières entrées
    });
    setCurrentHistoryIndex(prev => Math.min(prev + 1, 9));
  }, [currentHistoryIndex]);

  const undoLastChange = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const prevIndex = currentHistoryIndex - 1;
      const prevEntry = imageHistory[prevIndex];
      setSelectedImage(prevEntry.image);
      setAdjustments(prevEntry.adjustments);
      setCurrentHistoryIndex(prevIndex);
    }
  }, [currentHistoryIndex, imageHistory]);

  const redoLastChange = useCallback(() => {
    if (currentHistoryIndex < imageHistory.length - 1) {
      const nextIndex = currentHistoryIndex + 1;
      const nextEntry = imageHistory[nextIndex];
      setSelectedImage(nextEntry.image);
      setAdjustments(nextEntry.adjustments);
      setCurrentHistoryIndex(nextIndex);
    }
  }, [currentHistoryIndex, imageHistory]);

  const resetToOriginal = useCallback(() => {
    if (originalImage) {
      setSelectedImage(originalImage);
      setAdjustments({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0,
        zoom: 100,
        crop: { x: 0, y: 0, width: 100, height: 100 }
      });
    }
  }, [originalImage]);

  const resetAdjustments = useCallback(() => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      zoom: 100,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    });
  }, []);

  const processImageWithAdjustments = useCallback(() => {
    if (!selectedImage || !canvasRef.current) return Promise.resolve(selectedImage || "");

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(selectedImage || "");

    return new Promise<string>((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const scaleFactor = adjustments.zoom / 100;
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((adjustments.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.filter = `
          brightness(${adjustments.brightness}%)
          contrast(${adjustments.contrast}%)
          saturate(${adjustments.saturation}%)
        `;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Appliquer le recadrage si nécessaire
        if (adjustments.crop.width < 100 || adjustments.crop.height < 100) {
          const cropX = (adjustments.crop.x / 100) * canvas.width;
          const cropY = (adjustments.crop.y / 100) * canvas.height;
          const cropWidth = (adjustments.crop.width / 100) * canvas.width;
          const cropHeight = (adjustments.crop.height / 100) * canvas.height;
          
          const imageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          ctx.putImageData(imageData, 0, 0);
        }

        ctx.restore();
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = selectedImage || "";
    });
  }, [selectedImage, adjustments]);

  const simulateTextExtraction = useCallback((imageData: string): string[] => {
    // Simulation OCR améliorée
    const commonPatterns = availableCards.map(card => card.playerName.toUpperCase());
    
    const cardTextElements = [
      ...commonPatterns,
      ...Array.from(new Set(availableCards.map(card => card.teamName.toUpperCase()))),
      "ROOKIE CARD", "RC", "AUTOGRAPH", "AUTO", "INSERT", "PARALLEL",
      "SCORE", "PANINI", "TOPPS", "UPPER DECK",
      "#1", "#2", "#3", "#4", "#5", "#6", "#7", "#8", "#9", "#10",
      "GK", "DEF", "MID", "ATT", "FW"
    ];
    
    const numExtracted = Math.floor(Math.random() * 6) + 3;
    const shuffled = [...cardTextElements].sort(() => 0.5 - Math.random());
    
    return shuffled.slice(0, numExtracted);
  }, [availableCards]);

  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }, []);

  const levenshteinDistance = useCallback((str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }, []);

  const handleNextFromEdit = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      const processedImage = await processImageWithAdjustments();
      
      if (!processedImage || typeof processedImage !== 'string') {
        throw new Error("Échec du traitement de l'image");
      }

      // Simulation de reconnaissance OCR
      const extractedTexts = simulateTextExtraction(processedImage);
      
      let recognizedPlayerName = "";
      let confidence = 0;
      
      const uniquePlayers = Array.from(new Set(availableCards.map(card => card.playerName)));
      
      for (const text of extractedTexts) {
        for (const playerName of uniquePlayers) {
          const exactSimilarity = calculateSimilarity(text.toLowerCase(), playerName.toLowerCase());
          if (exactSimilarity > confidence && exactSimilarity > 0.6) {
            confidence = exactSimilarity;
            recognizedPlayerName = playerName;
          }
        }
      }
      
      if (recognizedPlayerName && confidence > 0.6) {
        setRecognizedCard(`Joueur reconnu: ${recognizedPlayerName} (${Math.round(confidence * 100)}% confiance)`);
        setPlayerName(recognizedPlayerName);
        
        const cardsForPlayer = availableCards.filter(card => {
          if (card.playerName !== recognizedPlayerName) return false;
          
          if (currentFilter) {
            switch (currentFilter) {
              case "bases":
                return card.cardType === "Base";
              case "bases_numbered":
                return card.cardType.includes("Parallel");
              case "hits":
                return card.cardType.includes("Insert");
              case "autos":
                return card.cardType.includes("Auto");
              default:
                return true;
            }
          }
          return true;
        });
        
        setPlayerCards(cardsForPlayer);
        if (cardsForPlayer.length > 0) {
          setSelectedCardId(cardsForPlayer[0].id);
          setCardNumber(cardsForPlayer[0].cardNumber);
        }
      } else {
        setRecognizedCard("Aucune reconnaissance automatique - sélection manuelle requise");
        setPlayerName("");
        setCardNumber("");
        setPlayerCards([]);
      }
      
    } catch (error) {
      console.error("Erreur de reconnaissance:", error);
      setRecognizedCard("Erreur de reconnaissance - sélection manuelle requise");
      setPlayerName("");
      setPlayerCards([]);
    } finally {
      setIsProcessing(false);
      setStep("assign");
    }
  }, [processImageWithAdjustments, availableCards, currentFilter, simulateTextExtraction, calculateSimilarity]);

  const handlePlayerNameChange = useCallback((name: string) => {
    setPlayerName(name);
    
    if (name.trim().length >= 2) {
      const searchTerm = name.toLowerCase();
      const uniquePlayers = Array.from(new Set(availableCards.map(card => card.playerName)));
      const suggestions = uniquePlayers.filter(player => 
        player.toLowerCase().includes(searchTerm)
      ).slice(0, 3);
      setPlayerSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      
      const matchingCards = availableCards.filter(card => 
        card.playerName.toLowerCase().includes(searchTerm)
      );
      setPlayerCards(matchingCards);
      
      if (matchingCards.length > 0) {
        setSelectedCardId(matchingCards[0].id);
      }
    } else {
      setShowSuggestions(false);
      setPlayerSuggestions([]);
      setPlayerCards([]);
      setSelectedCardId(undefined);
    }
  }, [availableCards]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPlayerName(suggestion);
    setShowSuggestions(false);
    handlePlayerNameChange(suggestion);
  }, [handlePlayerNameChange]);

  const handleClose = useCallback(() => {
    setStep("import");
    setSelectedImage(null);
    setOriginalImage(null);
    setImageHistory([]);
    setCurrentHistoryIndex(-1);
    setShowRetouchOptions(false);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      zoom: 100,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    });
    setRecognizedCard("");
    setSelectedCardId(undefined);
    setIsProcessing(false);
    setPlayerName("");
    setCardNumber("");
    setPlayerCards([]);
    setShowSuggestions(false);
    setPlayerSuggestions([]);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (selectedImage) {
      const processedImage = await processImageWithAdjustments();
      onSave(processedImage, selectedCardId);
      
      // Toast de succès vert
      toast({
        title: "Photo ajoutée avec succès !",
        description: "L'image a été assignée à la carte sélectionnée.",
        className: "bg-green-600 text-white border-green-500",
      });
      
      handleClose();
    }
  }, [processImageWithAdjustments, selectedCardId, onSave, handleClose, toast]);

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
              {step === "import" && "Choisissez comment importer votre photo de carte"}
              {step === "edit" && "Ajustez votre photo avant l'assignation"}
              {step === "assign" && "Confirmez l'assignation de la photo"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Étape d'import */}
        {step === "import" && (
          <div className="space-y-6 px-6 pb-6">
            <div className="text-center mb-6">
              <p className="text-gray-300 text-lg">Choisissez votre méthode d'import</p>
              <p className="text-sm text-gray-400 mt-1">Formats supportés: JPG, PNG, WEBP (max 10MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center gap-3 text-white border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-blue-400 transition-all duration-200"
                onClick={() => handleImportOption("gallery")}
              >
                <Image className="h-8 w-8 text-blue-400" />
                <div className="text-center">
                  <span className="font-medium">Photothèque</span>
                  <p className="text-xs text-gray-400 mt-1">Depuis vos photos</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-32 flex flex-col items-center gap-3 text-white border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-green-400 transition-all duration-200"
                onClick={() => handleImportOption("file")}
              >
                <Upload className="h-8 w-8 text-green-400" />
                <div className="text-center">
                  <span className="font-medium">Fichier</span>
                  <p className="text-xs text-gray-400 mt-1">Parcourir les dossiers</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center gap-3 text-white border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-orange-400 transition-all duration-200"
                onClick={() => handleImportOption("camera")}
              >
                <Camera className="h-8 w-8 text-orange-400" />
                <div className="text-center">
                  <span className="font-medium">Appareil photo</span>
                  <p className="text-xs text-gray-400 mt-1">Prendre une photo</p>
                </div>
              </Button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CircleDot className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white mb-1">Conseils pour de meilleures photos</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Utilisez un bon éclairage naturel</li>
                    <li>• Placez la carte sur une surface plane</li>
                    <li>• Évitez les reflets et les ombres</li>
                    <li>• Centrez bien la carte dans le cadre</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Inputs cachés pour les fichiers */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
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
                <div className="relative bg-gray-100 rounded-lg overflow-hidden transform-none" ref={imageContainerRef}>
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain transition-all duration-300"
                    style={{
                      filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
                      transform: `rotate(${adjustments.rotation}deg) scale(${adjustments.zoom / 100})`
                    }}
                  />
                  
                  {/* Zone de recadrage interactive */}
                  {selectedRetouchTool === 'crop' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Overlay sombre */}
                      <div className="absolute inset-0 bg-black/50"></div>
                      
                      {/* Zone de recadrage */}
                      <div 
                        className="absolute border-2 border-white bg-transparent pointer-events-auto cursor-move"
                        style={{
                          left: `${cropArea.x}%`,
                          top: `${cropArea.y}%`,
                          width: `${cropArea.width}%`,
                          height: `${cropArea.height}%`,
                        }}
                      >
                        {/* Coins de redimensionnement */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize"></div>
                        
                        {/* Grille de règle des tiers */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50"></div>
                          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50"></div>
                          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50"></div>
                          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Contrôles de zoom en overlay */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAdjustments(prev => ({ ...prev, zoom: Math.max(50, prev.zoom - 25) }))}
                      className="w-8 h-8 p-0"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAdjustments(prev => ({ ...prev, zoom: Math.min(200, prev.zoom + 25) }))}
                      className="w-8 h-8 p-0"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Boutons d'action améliorés */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRetouchOptions(!showRetouchOptions)} className="flex-1 text-black bg-white border-gray-300 hover:bg-gray-100">
                  <Edit className="h-4 w-4 mr-2" />
                  {showRetouchOptions ? "Masquer" : "Retoucher"}
                </Button>
                <Button onClick={handleNextFromEdit} className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isProcessing}>
                  {isProcessing ? (
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isProcessing ? "Analyse..." : "Confirmer"}
                </Button>
              </div>

              {/* Contrôles d'historique */}
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={undoLastChange}
                  disabled={currentHistoryIndex <= 0}
                  className="flex items-center gap-1 text-black bg-white border-gray-300 hover:bg-gray-100"
                >
                  <RotateCw className="h-4 w-4 rotate-180" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={redoLastChange}
                  disabled={currentHistoryIndex >= imageHistory.length - 1}
                  className="flex items-center gap-1 text-black bg-white border-gray-300 hover:bg-gray-100"
                >
                  <RotateCw className="h-4 w-4" />
                  Refaire
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetToOriginal}
                  className="flex items-center gap-1 text-black bg-white border-gray-300 hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Original
                </Button>
              </div>

              {/* Interface de retouche style Instagram */}
              {showRetouchOptions && (
                <div className="space-y-0">
                  {/* Bandeau de retouche inspiré d'Instagram */}
                  <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 py-4 mx-0 overflow-hidden">
                    <div className="flex gap-6 overflow-x-auto px-4 scrollbar-hide min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      
                      {/* Outil Ajuster */}
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <Button
                          variant="ghost"
                          className={`w-12 h-12 rounded-full p-2 ${
                            selectedRetouchTool === 'adjust' 
                              ? 'bg-white text-black' 
                              : 'bg-transparent text-white hover:bg-white/20'
                          }`}
                          onClick={() => setSelectedRetouchTool(selectedRetouchTool === 'adjust' ? null : 'adjust')}
                        >
                          <RotateCw className="h-6 w-6" />
                        </Button>
                        <span className={`text-sm font-medium ${
                          selectedRetouchTool === 'adjust' ? 'text-white' : 'text-gray-300'
                        }`}>
                          Ajuster
                        </span>
                      </div>

                      {/* Outil Lux */}
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <Button
                          variant="ghost"
                          className={`w-12 h-12 rounded-full p-2 ${
                            selectedRetouchTool === 'lux' 
                              ? 'bg-white text-black' 
                              : 'bg-transparent text-white hover:bg-white/20'
                          }`}
                          onClick={() => setSelectedRetouchTool(selectedRetouchTool === 'lux' ? null : 'lux')}
                        >
                          <Maximize className="h-6 w-6" />
                        </Button>
                        <span className={`text-sm font-medium ${
                          selectedRetouchTool === 'lux' ? 'text-white' : 'text-gray-300'
                        }`}>
                          Lux
                        </span>
                      </div>

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

                  {/* Panneau de réglage déroulant */}
                  {selectedRetouchTool && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mx-0">
                      {selectedRetouchTool === 'adjust' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">Rotation</span>
                            <span className="text-gray-400 text-sm">{adjustments.rotation}°</span>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 0 }))} className="text-black">
                              0°
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 90 }))} className="text-black">
                              90°
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 180 }))} className="text-black">
                              180°
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 270 }))} className="text-black">
                              270°
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'lux' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">Éclat</span>
                            <span className="text-gray-400 text-sm">{adjustments.zoom}%</span>
                          </div>
                          <Slider
                            value={[adjustments.zoom]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, zoom: value }))}
                            min={50}
                            max={200}
                            step={5}
                            className="w-full mb-3"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, zoom: 75 }))} className="text-black">
                              75%
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, zoom: 100 }))} className="text-black">
                              100%
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, zoom: 150 }))} className="text-black">
                              150%
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'brightness' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">Luminosité</span>
                            <span className="text-gray-400 text-sm">{adjustments.brightness}%</span>
                          </div>
                          <Slider
                            value={[adjustments.brightness]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                            min={25}
                            max={200}
                            step={1}
                            className="w-full mb-3"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, brightness: 75 }))} className="text-black">
                              Sombre
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, brightness: 100 }))} className="text-black">
                              Normal
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, brightness: 125 }))} className="text-black">
                              Clair
                            </Button>
                          </div>
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
                            min={25}
                            max={200}
                            step={1}
                            className="w-full mb-3"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, contrast: 75 }))} className="text-black">
                              Doux
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, contrast: 100 }))} className="text-black">
                              Normal
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, contrast: 125 }))} className="text-black">
                              Intense
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'crop' && (
                        <div>
                          <div className="mb-3">
                            <span className="text-white font-medium">Recadrer l'image</span>
                          </div>
                          <div className="text-center text-gray-400 text-sm mb-3">
                            Faites glisser les coins pour ajuster la zone de recadrage
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => setCropArea({ x: 10, y: 10, width: 80, height: 80 })} className="text-black">
                              Carré
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCropArea({ x: 10, y: 15, width: 80, height: 70 })} className="text-black">
                              16:9
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCropArea({ x: 10, y: 20, width: 80, height: 60 })} className="text-black">
                              4:3
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'saturation' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">Saturation</span>
                            <span className="text-gray-400 text-sm">{adjustments.saturation}%</span>
                          </div>
                          <Slider
                            value={[adjustments.saturation]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, saturation: value }))}
                            min={0}
                            max={200}
                            step={1}
                            className="w-full mb-3"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, saturation: 0 }))} className="text-black">
                              N&B
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, saturation: 100 }))} className="text-black">
                              Normal
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, saturation: 150 }))} className="text-black">
                              Vibrant
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'rotation' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">Rotation</span>
                            <span className="text-gray-400 text-sm">{adjustments.rotation}°</span>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 0 }))} className="text-black">
                              0°
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 90 }))} className="text-black">
                              90°
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 180 }))} className="text-black">
                              180°
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, rotation: 270 }))} className="text-black">
                              270°
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'zoom' && (
                        <div>
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
                            className="w-full mb-3"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, zoom: 75 }))} className="text-black">
                              75%
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, zoom: 100 }))} className="text-black">
                              100%
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAdjustments(prev => ({ ...prev, zoom: 150 }))} className="text-black">
                              150%
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedRetouchTool === 'filters' && (
                        <div>
                          <div className="mb-3">
                            <span className="text-white font-medium">Filtres prédéfinis</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjustments(prev => ({ 
                                ...prev, 
                                brightness: 110, 
                                contrast: 115, 
                                saturation: 105 
                              }))}
                              className="text-xs text-black"
                            >
                              Carte sportive
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjustments(prev => ({ 
                                ...prev, 
                                brightness: 105, 
                                contrast: 125, 
                                saturation: 85 
                              }))}
                              className="text-xs text-black"
                            >
                              Vintage
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjustments(prev => ({ 
                                ...prev, 
                                brightness: 115, 
                                contrast: 110, 
                                saturation: 120 
                              }))}
                              className="text-xs text-black"
                            >
                              Éclatant
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjustments(prev => ({ 
                                ...prev, 
                                brightness: 95, 
                                contrast: 130, 
                                saturation: 90 
                              }))}
                              className="text-xs text-black"
                            >
                              Dramatique
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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

              {recognizedCard && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                  <p className="text-green-300 text-sm">{recognizedCard}</p>
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
                      Carte ({playerName ? `${playerCards.length} carte(s) trouvée(s)` : "Aucune carte trouvée"})
                    </label>
                    <Select value={selectedCardId?.toString()} onValueChange={(value) => setSelectedCardId(parseInt(value))}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionner une carte" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {playerCards.map((card) => (
                          <SelectItem key={card.id} value={card.id.toString()} className="text-white hover:bg-gray-700">
                            {card.cardNumber} - {card.playerName} ({card.teamName}) - {card.cardType}
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
              <Button onClick={handleSave} disabled={!selectedCardId} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                <Check className="h-4 w-4 mr-2" />
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}