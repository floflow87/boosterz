import { useState, useRef } from "react";
import { X, Camera, Upload, Search, RotateCcw, Crop, Check, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection } from "@shared/schema";

interface CardAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  selectedCollection?: number;
}

type Step = "import" | "edit" | "recognition" | "details" | "confirmation";

interface RecognitionResult {
  playerName: string;
  teamName: string;
  confidence: number;
}

export default function CardAddModal({ isOpen, onClose, collections, selectedCollection }: CardAddModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("import");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editedImage, setEditedImage] = useState<string>("");
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form data
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(selectedCollection?.toString() || "");
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [numbering, setNumbering] = useState("");
  
  // Image editing states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const resetModal = () => {
    setCurrentStep("import");
    setSelectedImage(null);
    setImagePreview("");
    setEditedImage("");
    setRecognitionResult(null);
    setPlayerName("");
    setTeamName("");
    setCardNumber("");
    setNumbering("");
    setBrightness(100);
    setContrast(100);
    setRotation(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Image import handlers
  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setEditedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
      setCurrentStep("edit");
    }
  };

  const handleCameraCapture = () => {
    // Simulate camera capture for demo
    fileInputRef.current?.click();
  };

  // Image editing handlers
  const applyImageEdits = () => {
    // Apply brightness, contrast, and rotation to the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        const editedDataUrl = canvas.toDataURL();
        setEditedImage(editedDataUrl);
      }
    };
    img.src = imagePreview;
  };

  // Card recognition handler
  const handleRecognition = async () => {
    if (!editedImage) return;
    
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/cards/recognize", {
        imageData: editedImage
      });
      
      setRecognitionResult(response);
      setPlayerName(response.playerName || "");
      setTeamName(response.teamName || "");
      setCurrentStep("details");
    } catch (error) {
      console.error("Recognition failed:", error);
      toast({
        title: "Erreur de reconnaissance",
        description: "Impossible de reconnaître la carte automatiquement",
        variant: "destructive",
      });
      setCurrentStep("details");
    } finally {
      setIsProcessing(false);
    }
  };

  // Final card creation
  const createCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      return apiRequest("POST", "/api/cards", cardData);
    },
    onSuccess: () => {
      toast({
        title: "Carte ajoutée avec succès",
        description: "La carte a été ajoutée à votre collection",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      if (selectedCollectionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/collections/${selectedCollectionId}/cards`] });
      }
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la carte",
        variant: "destructive",
      });
    }
  });

  const handleFinalSubmit = () => {
    if (!selectedCollectionId || !playerName || !cardNumber) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const cardData = {
      collectionId: parseInt(selectedCollectionId),
      playerName,
      teamName,
      reference: cardNumber,
      numbering,
      imageUrl: editedImage,
      isOwned: true
    };

    createCardMutation.mutate(cardData);
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