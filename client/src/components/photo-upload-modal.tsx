import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, Image, X, RotateCw, Sun, Contrast, Droplets, CircleDot, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string) => void;
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: number;
  rotation: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function PhotoUploadModal({ isOpen, onClose, onSave }: PhotoUploadModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    vignette: 0,
    rotation: 0,
    crop: { x: 0, y: 0, width: 100, height: 100 }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  const handleGallerySelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const applyFilters = useCallback(() => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = document.createElement('img');
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((adjustments.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Apply filters
      ctx.filter = `
        brightness(${adjustments.brightness}%)
        contrast(${adjustments.contrast}%)
        saturate(${adjustments.saturation}%)
      `;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Apply vignette effect
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
    };
    img.src = selectedImage;
  }, [selectedImage, adjustments]);

  const handleSave = useCallback(() => {
    if (!canvasRef.current) return;
    
    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onSave(imageData);
    handleClose();
  }, [onSave]);

  const handleClose = useCallback(() => {
    setSelectedImage(null);
    setIsEditing(false);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 0,
      rotation: 0,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    });
    onClose();
  }, [onClose]);

  const resetAdjustments = useCallback(() => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 0,
      rotation: 0,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? "Retoucher la photo" : "Ajouter une photo"}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground mb-6">
              Choisissez comment ajouter votre photo
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-32 flex-col space-y-2"
                onClick={handleGallerySelect}
              >
                <Image className="h-8 w-8" />
                <span>Photothèque</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-32 flex-col space-y-2"
                onClick={handleGallerySelect}
              >
                <Upload className="h-8 w-8" />
                <span>Fichier</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-32 flex-col space-y-2"
                onClick={handleCameraCapture}
              >
                <Camera className="h-8 w-8" />
                <span>Appareil photo</span>
              </Button>
            </div>

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
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Image Preview */}
              <div className="flex-1">
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {selectedImage && (
                    <>
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="w-full h-auto max-h-96 object-contain"
                        style={{
                          filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
                          transform: `rotate(${adjustments.rotation}deg)`
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                        onLoad={applyFilters}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Editing Controls */}
              <div className="w-full lg:w-80 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
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
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
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
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
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
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
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
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
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
                    <Button onClick={handleSave} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}