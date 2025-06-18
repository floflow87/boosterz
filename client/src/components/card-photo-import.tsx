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
  availableCards: Array<{ id: number; cardNumber: string; playerName: string; teamName: string; cardType: string }>;
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: number;
  rotation: number;
}

export default function CardPhotoImport({ isOpen, onClose, onSave, availableCards }: CardPhotoImportProps) {
  const [step, setStep] = useState<"import" | "edit" | "recognize" | "assign">("import");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    vignette: 0,
    rotation: 0
  });
  const [recognizedCard, setRecognizedCard] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
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

        if (adjustments.vignette > 0) {
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, `rgba(0,0,0,0)`);
          gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100})`);
          
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = selectedImage || "";
    });
  }, [selectedImage, adjustments]);

  const handleNextFromEdit = useCallback(async () => {
    setIsProcessing(true);
    const processedImage = await processImageWithAdjustments();
    
    // Simulate card recognition
    setTimeout(() => {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      if (randomCard) {
        setRecognizedCard(`${randomCard.playerName} - ${randomCard.cardNumber}`);
        setSelectedCardId(randomCard.id);
      }
      setIsProcessing(false);
      setStep("recognize");
    }, 2000);
  }, [processImageWithAdjustments, availableCards]);

  const handleSave = useCallback(async () => {
    const processedImage = await processImageWithAdjustments();
    if (typeof processedImage === 'string') {
      onSave(processedImage, selectedCardId);
    }
    handleClose();
  }, [processImageWithAdjustments, selectedCardId, onSave]);

  const handleClose = useCallback(() => {
    setStep("import");
    setSelectedImage(null);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 0,
      rotation: 0
    });
    setRecognizedCard("");
    setSelectedCardId(undefined);
    setIsProcessing(false);
    onClose();
  }, [onClose]);

  const resetAdjustments = useCallback(() => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 0,
      rotation: 0
    });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-black">
            {step === "import" && "Importer une photo"}
            {step === "edit" && "Retoucher la photo"}
            {step === "recognize" && "Reconnaissance automatique"}
            {step === "assign" && "Assigner à une carte"}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {step === "import" && "Choisissez comment importer votre photo de carte"}
            {step === "edit" && "Ajustez votre photo avant la reconnaissance"}
            {step === "recognize" && "Vérifiez la carte reconnue automatiquement"}
            {step === "assign" && "Confirmez l'assignation de la photo"}
          </DialogDescription>
        </DialogHeader>

        {step === "import" && (
          <div className="space-y-4">
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
                <span>Importer depuis un fichier</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-16 flex items-center gap-3 text-black border-gray-300 hover:bg-gray-50"
                onClick={() => handleImportOption("camera")}
              >
                <Camera className="h-6 w-6" />
                <span>Ouvrir l'appareil photo</span>
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
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
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

              <div className="w-full lg:w-80 space-y-4">
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
                    Vignettage: {adjustments.vignette}%
                  </label>
                  <Slider
                    value={[adjustments.vignette]}
                    onValueChange={([value]) => setAdjustments(prev => ({ ...prev, vignette: value }))}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2 text-black">
                    <RotateCw className="h-4 w-4" />
                    Rotation: {adjustments.rotation}°
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdjustments(prev => ({ ...prev, rotation: (prev.rotation - 90) % 360 }))}
                    >
                      -90°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdjustments(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                    >
                      +90°
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetAdjustments} className="flex-1">
                    Réinitialiser
                  </Button>
                  <Button onClick={handleNextFromEdit} className="flex-1" disabled={isProcessing}>
                    {isProcessing ? (
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? "Analyse..." : "Reconnaître"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "recognize" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-800 mb-2">Carte reconnue automatiquement</h3>
                <p className="text-green-700">{recognizedCard}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Modifier la référence (optionnel)
                  </label>
                  <Select value={selectedCardId?.toString()} onValueChange={(value) => setSelectedCardId(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une carte" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCards.map((card) => (
                        <SelectItem key={card.id} value={card.id.toString()}>
                          {card.playerName} - {card.cardNumber} ({card.cardType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("edit")} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
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