import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Image, X, RotateCw, Sun, Contrast, Droplets, CircleDot, Check, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CardPhotoImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string, cardId?: number) => void;
  availableCards: Array<{ id: number; cardNumber: string; playerName: string; teamName: string; cardType: string; collectionId: number; }>;
  preselectedCard?: { id: number; playerName: string; reference: string; teamName: string; };
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function CardPhotoImport({ isOpen, onClose, onSave, availableCards, preselectedCard }: CardPhotoImportProps) {
  const [step, setStep] = useState<"import" | "edit" | "assign">("import");
  const [showRetouchOptions, setShowRetouchOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    crop: {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    }
  });
  const [recognizedCard, setRecognizedCard] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>(preselectedCard?.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerName, setPlayerName] = useState<string>(preselectedCard?.playerName || "");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [playerCards, setPlayerCards] = useState<Array<{ id: number; cardNumber: string; playerName: string; teamName: string; cardType: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([]);
  const [cardType, setCardType] = useState("");
  const [cardTypeSuggestions, setCardTypeSuggestions] = useState<string[]>([]);
  const [showCardTypeSuggestions, setShowCardTypeSuggestions] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setSelectedImage(result);
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

  const processImageWithAdjustments = useCallback(() => {
    if (!selectedImage || !canvasRef.current) return selectedImage;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return selectedImage;

    return new Promise<string>((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

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

        ctx.drawImage(img, 0, 0);

        // Apply crop if needed
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
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = selectedImage || "";
    });
  }, [selectedImage, adjustments]);

  const handleNextFromEdit = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      const processedImage = await processImageWithAdjustments();
      
      if (!processedImage || typeof processedImage !== 'string') {
        throw new Error("Failed to process image");
      }

      // Simulate OCR text recognition on the image
      const extractedTexts = simulateTextExtraction(processedImage);
      
      // Try to find player name in extracted text
      let recognizedPlayerName = "";
      let confidence = 0;
      
      // Check against available players
      const uniquePlayers = Array.from(new Set(availableCards.map(card => card.playerName)));
      
      for (const text of extractedTexts) {
        for (const playerName of uniquePlayers) {
          const similarity = calculateSimilarity(text.toLowerCase(), playerName.toLowerCase());
          if (similarity > confidence && similarity > 0.6) {
            confidence = similarity;
            recognizedPlayerName = playerName;
          }
        }
      }
      
      if (recognizedPlayerName && confidence > 0.6) {
        setRecognizedCard(`Joueur reconnu: ${recognizedPlayerName} (${Math.round(confidence * 100)}% confiance)`);
        setPlayerName(recognizedPlayerName);
        
        // Find cards for this player
        const cardsForPlayer = availableCards.filter(card => 
          card.playerName === recognizedPlayerName
        );
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
      console.error("Recognition error:", error);
      setRecognizedCard("Erreur de reconnaissance - sélection manuelle requise");
      setPlayerName("");
      setPlayerCards([]);
    } finally {
      setIsProcessing(false);
      setStep("assign");
    }
  }, [processImageWithAdjustments, availableCards]);

  const simulateTextExtraction = useCallback((imageData: string): string[] => {
    // This is a simulation of OCR. In a real app, you'd use an OCR service like Tesseract.js
    // For now, return some common player name patterns that might be found on cards
    return [
      "WISSAM BEN YEDDER",
      "KYLIAN MBAPPÉ", 
      "ALEXANDRE LACAZETTE",
      "PIERRE-EMERICK AUBAMEYANG",
      "JONATHAN DAVID",
      "FOLARIN BALOGUN"
    ];
  }, []);

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

  const handleSave = useCallback(async () => {
    const processedImage = await processImageWithAdjustments();
    if (typeof processedImage === 'string') {
      onSave(processedImage, selectedCardId);
    }
    handleClose();
  }, [processImageWithAdjustments, selectedCardId, onSave]);

  const handleRemovePhoto = useCallback(() => {
    setSelectedImage(null);
    setStep("import");
    setShowRetouchOptions(false);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    });
  }, []);

  const handlePlayerNameChange = useCallback((name: string) => {
    setPlayerName(name);
    
    if (name.trim().length > 0) {
      // Get unique player names for autocomplete
      const uniquePlayers = Array.from(new Set(availableCards.map(card => card.playerName)));
      const suggestions = uniquePlayers.filter(player => 
        player.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      
      setPlayerSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0 && suggestions[0].toLowerCase() !== name.toLowerCase());
      
      // Find matching cards
      const matchingCards = availableCards.filter(card => 
        card.playerName.toLowerCase().includes(name.toLowerCase())
      );
      setPlayerCards(matchingCards);
      if (matchingCards.length > 0) {
        setSelectedCardId(matchingCards[0].id);
      }
    } else {
      setPlayerSuggestions([]);
      setShowSuggestions(false);
      setPlayerCards([]);
      setSelectedCardId(undefined);
    }
  }, [availableCards]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPlayerName(suggestion);
    setShowSuggestions(false);
    const matchingCards = availableCards.filter(card => 
      card.playerName.toLowerCase() === suggestion.toLowerCase()
    );
    setPlayerCards(matchingCards);
    if (matchingCards.length > 0) {
      setSelectedCardId(matchingCards[0].id);
    }
  }, [availableCards]);

  const handleClose = useCallback(() => {
    setStep("import");
    setSelectedImage(null);
    setShowRetouchOptions(false);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    });
    setRecognizedCard("");
    setSelectedCardId(undefined);
    setIsProcessing(false);
    setPlayerName("");
    setCardNumber("");
    setPlayerCards([]);
    setShowSuggestions(false);
    setPlayerSuggestions([]);
    setCardType("");
    setCardTypeSuggestions([]);
    setShowCardTypeSuggestions(false);
    onClose();
  }, [onClose]);

  const resetAdjustments = useCallback(() => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white text-black p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-black">
              {step === "import" && "Importer une photo"}
              {step === "edit" && "Retoucher la photo"}
              {step === "assign" && "Assigner à une carte"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {step === "import" && "Choisissez comment importer votre photo de carte"}
              {step === "edit" && "Ajustez votre photo avant l'assignation"}
              {step === "assign" && "Confirmez l'assignation de la photo"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {step === "import" && (
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-16 flex items-center gap-3 text-black border-gray-300 hover:bg-gray-50"
                onClick={() => handleImportOption("gallery")}
              >
                <Image className="h-6 w-6" />
                <span>Importer depuis la photothèque</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-16 flex items-center gap-3 text-black border-gray-300 hover:bg-gray-50"
                onClick={() => handleImportOption("file")}
              >
                <Upload className="h-6 w-6" />
                <span>Choisir le fichier</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-16 flex items-center gap-3 text-black border-gray-300 hover:bg-gray-50"
                onClick={() => handleImportOption("camera")}
              >
                <Camera className="h-6 w-6" />
                <span>Prendre une photo</span>
              </Button>
            </div>

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

        {step === "edit" && selectedImage && (
          <div className="space-y-4 px-6 pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                    style={{
                      filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
                      transform: `rotate(${adjustments.rotation}deg)`
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRetouchOptions(!showRetouchOptions)} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Retoucher
                </Button>
                <Button onClick={handleNextFromEdit} className="flex-1" disabled={isProcessing}>
                  {isProcessing ? (
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isProcessing ? "Analyse..." : "Confirmer"}
                </Button>
              </div>

              {showRetouchOptions && (
                <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2 text-black">
                        <Sun className="h-4 w-4" />
                        Luminosité: {adjustments.brightness}%
                      </label>
                      <Slider
                        value={[adjustments.brightness]}
                        onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2 text-black">
                        <Contrast className="h-4 w-4" />
                        Contraste: {adjustments.contrast}%
                      </label>
                      <Slider
                        value={[adjustments.contrast]}
                        onValueChange={([value]) => setAdjustments(prev => ({ ...prev, contrast: value }))}
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-black">
                      <RotateCw className="h-4 w-4" />
                      Pivoter: {adjustments.rotation}°
                    </label>
                    <Slider
                      value={[adjustments.rotation]}
                      onValueChange={([value]) => setAdjustments(prev => ({ ...prev, rotation: value }))}
                      min={0}
                      max={360}
                      step={90}
                      className="w-full"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setAdjustments(prev => ({ ...prev, rotation: 0 }))}
                      >
                        0°
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setAdjustments(prev => ({ ...prev, rotation: 90 }))}
                      >
                        90°
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setAdjustments(prev => ({ ...prev, rotation: 180 }))}
                      >
                        180°
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setAdjustments(prev => ({ ...prev, rotation: 270 }))}
                      >
                        270°
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-black">
                      <Droplets className="h-4 w-4" />
                      Saturation: {adjustments.saturation}%
                    </label>
                    <Slider
                      value={[adjustments.saturation]}
                      onValueChange={([value]) => setAdjustments(prev => ({ ...prev, saturation: value }))}
                      min={0}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-black">
                      <CircleDot className="h-4 w-4" />
                      Recadrage: {adjustments.crop.width}% × {adjustments.crop.height}%
                    </label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Largeur</label>
                          <Slider
                            value={[adjustments.crop.width]}
                            onValueChange={([value]) => setAdjustments(prev => ({ 
                              ...prev, 
                              crop: { ...prev.crop, width: value }
                            }))}
                            min={10}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Hauteur</label>
                          <Slider
                            value={[adjustments.crop.height]}
                            onValueChange={([value]) => setAdjustments(prev => ({ 
                              ...prev, 
                              crop: { ...prev.crop, height: value }
                            }))}
                            min={10}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>



                  <Button variant="outline" onClick={resetAdjustments} className="w-full">
                    Réinitialiser
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment Step */}
        {step === "assign" && (
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-4">
              {selectedImage && (
                <div className="mb-4 text-center">
                  <div 
                    className="w-56 h-72 mx-auto perspective-1000 relative"
                    style={{ perspective: '1000px' }}
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 z-10 w-8 h-8 p-0 rounded-full shadow-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <img
                      ref={imageRef}
                      src={selectedImage || ""}
                      alt="Photo importée"
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200 cursor-pointer transition-transform duration-500 hover:scale-105"
                      style={{
                        transformStyle: 'preserve-3d',
                        willChange: 'transform'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const target = imageRef.current;
                        if (!target) return;
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        let rotateX = 0;
                        let rotateY = 0;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          rotateY = deltaX * 0.5;
                          rotateX = -deltaY * 0.5;
                          if (target) {
                            target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                          }
                        };
                        
                        const handleMouseUp = () => {
                          if (target) {
                            target.style.transform = 'rotateX(0deg) rotateY(0deg)';
                          }
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        const target = imageRef.current;
                        if (!target || !e.touches[0]) return;
                        
                        const touch = e.touches[0];
                        const startX = touch.clientX;
                        const startY = touch.clientY;
                        let rotateX = 0;
                        let rotateY = 0;
                        
                        const handleTouchMove = (moveEvent: TouchEvent) => {
                          if (!moveEvent.touches[0]) return;
                          const moveTouch = moveEvent.touches[0];
                          const deltaX = moveTouch.clientX - startX;
                          const deltaY = moveTouch.clientY - startY;
                          rotateY = deltaX * 0.5;
                          rotateX = -deltaY * 0.5;
                          if (target) {
                            target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                          }
                        };
                        
                        const handleTouchEnd = () => {
                          if (target) {
                            target.style.transform = 'rotateX(0deg) rotateY(0deg)';
                          }
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        };
                        
                        document.addEventListener('touchmove', handleTouchMove);
                        document.addEventListener('touchend', handleTouchEnd);
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Reconnaissance automatique</h3>
                <p className="text-green-700 font-medium">{recognizedCard}</p>
                <p className="text-xs text-green-600 mt-1">Vous pouvez modifier cette sélection ci-dessous</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-black mb-2">
                    Nom du joueur
                  </label>
                  <Input
                    type="text"
                    placeholder="Saisir le nom du joueur..."
                    value={playerName}
                    onChange={(e) => handlePlayerNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    className="w-full"
                  />
                  
                  {showSuggestions && playerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                      {playerSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Modifiez le nom pour voir toutes les cartes de ce joueur
                  </p>
                </div>

                {playerCards.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Cartes disponibles pour {playerName} ({playerCards.length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {playerCards.map((card) => (
                        <div
                          key={card.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedCardId === card.id 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          onClick={() => setSelectedCardId(card.id)}
                        >
                          <div className="font-medium text-black">{card.cardNumber} - {card.cardType}</div>
                          <div className="text-sm text-gray-600">{card.teamName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {playerCards.length === 0 && playerName.trim() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      Aucune carte trouvée pour "{playerName}". Vérifiez l'orthographe ou sélectionnez manuellement.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Numéro de carte
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: #001, #A01, #NU01..."
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full mb-3"
                  />
                  <p className="text-xs text-gray-500 mb-3">
                    Modifiez le numéro si la reconnaissance n'est pas correcte
                  </p>
                  
                  <label className="block text-sm font-medium text-black mb-2">
                    Type de carte (optionnel)
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Ex: Base, Hit, Autograph, Special..."
                      value={cardType}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCardType(value);
                        
                        if (value.length > 0) {
                          const uniqueTypes = Array.from(new Set(availableCards.map(card => card.cardType).filter(Boolean)));
                          const suggestions = uniqueTypes.filter(type => 
                            type.toLowerCase().includes(value.toLowerCase())
                          );
                          setCardTypeSuggestions(suggestions);
                          setShowCardTypeSuggestions(suggestions.length > 0);
                        } else {
                          setShowCardTypeSuggestions(false);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowCardTypeSuggestions(false), 150)}
                      className="w-full"
                    />
                    
                    {showCardTypeSuggestions && cardTypeSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                        {cardTypeSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setCardType(suggestion);
                              setShowCardTypeSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("edit")} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleSave} className="flex-1" disabled={!selectedCardId}>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}