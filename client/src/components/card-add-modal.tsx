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

  const getStepTitle = () => {
    switch (currentStep) {
      case "import": return "Importer une photo";
      case "edit": return "Retoucher la photo";
      case "recognition": return "Reconnaissance automatique";
      case "details": return "Détails de la carte";
      case "confirmation": return "Confirmation";
      default: return "Ajouter une carte";
    }
  };

  return (
    <div className="fixed inset-0 bg-[hsl(214,35%,11%)] z-50 overflow-y-auto">
      <div className="min-h-screen">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between p-6 bg-[hsl(214,35%,22%)] border-b border-gray-600 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            {currentStep !== "import" && (
              <button
                onClick={() => {
                  const steps: Step[] = ["import", "edit", "recognition", "details", "confirmation"];
                  const currentIndex = steps.indexOf(currentStep);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1]);
                  }
                }}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white font-poppins">{getStepTitle()}</h2>
          </div>
          
          {/* Step Progress */}
          <div className="flex space-x-2">
            {["import", "edit", "recognition", "details", "confirmation"].map((step, index) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step === currentStep
                    ? "bg-[hsl(9,85%,67%)]"
                    : ["import", "edit", "recognition", "details", "confirmation"].indexOf(currentStep) > index
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              />
            ))}
          </div>
          
          <button onClick={handleClose} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 pb-20">
          {/* Step 1: Import Photo */}
          {currentStep === "import" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-400">Commencez par importer ou prendre une photo de votre carte</p>
              </div>
              
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <p className="text-gray-400 mb-6 text-lg">Prendre une photo ou importer une image</p>
                
                <div className="flex flex-col space-y-4 max-w-xs mx-auto">
                  <Button
                    type="button"
                    onClick={handleCameraCapture}
                    className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Prendre une photo
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Importer de la galerie
                  </Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Step 2: Edit Photo */}
          {currentStep === "edit" && imagePreview && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-400">Ajustez votre photo si nécessaire</p>
              </div>
              
              <div className="bg-[hsl(214,35%,18%)] rounded-lg p-4">
                <div className="flex justify-center mb-6">
                  <img
                    src={editedImage || imagePreview}
                    alt="Carte"
                    className="max-w-full max-h-96 object-contain rounded-lg"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      transform: `rotate(${rotation}deg)`
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm mb-2">Luminosité</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">Contraste</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRotation(rotation - 90)}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRotation(rotation + 90)}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <RotateCcw className="w-4 h-4 transform scale-x-[-1]" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("import")}
                  className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    applyImageEdits();
                    setCurrentStep("recognition");
                  }}
                  className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white"
                >
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Recognition */}
          {currentStep === "recognition" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-400">Reconnaissance automatique en cours...</p>
              </div>
              
              <div className="bg-[hsl(214,35%,18%)] rounded-lg p-6 text-center">
                {isProcessing ? (
                  <div>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[hsl(9,85%,67%)] mx-auto mb-4"></div>
                    <p className="text-white">Analyse de l'image en cours...</p>
                    <p className="text-gray-400 text-sm mt-2">Cela peut prendre quelques secondes</p>
                  </div>
                ) : (
                  <div>
                    <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-white mb-2">Reconnaissance terminée</p>
                    {recognitionResult && (
                      <div className="text-left bg-[hsl(214,35%,15%)] rounded-lg p-4 mt-4">
                        <p className="text-gray-400 text-sm mb-2">Résultats détectés:</p>
                        <p className="text-white">Joueur: {recognitionResult.playerName}</p>
                        <p className="text-white">Équipe: {recognitionResult.teamName}</p>
                        <p className="text-gray-400 text-sm">Confiance: {Math.round(recognitionResult.confidence * 100)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {!isProcessing && (
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep("edit")}
                    className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    Retour
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("details")}
                    className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white"
                  >
                    Continuer
                  </Button>
                </div>
              )}
              
              {currentStep === "recognition" && !isProcessing && !recognitionResult && (
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={handleRecognition}
                    className="w-full bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white"
                  >
                    Démarrer la reconnaissance
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Details */}
          {currentStep === "details" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-400">Complétez les informations de la carte</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-2">Collection *</label>
                  <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                    <SelectTrigger className="bg-[hsl(216,46%,13%)] border-gray-600 text-white">
                      <SelectValue placeholder="Sélectionner une collection" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {collections.map((coll) => (
                        <SelectItem key={coll.id} value={coll.id.toString()}>{coll.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2">Nom du joueur *</label>
                  <Input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ex: Kylian Mbappé"
                    className="bg-[hsl(216,46%,13%)] border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2">Équipe</label>
                  <Input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ex: Paris Saint-Germain"
                    className="bg-[hsl(216,46%,13%)] border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2">Numéro de carte *</label>
                  <Input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Ex: 001"
                    className="bg-[hsl(216,46%,13%)] border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2">Numérotation</label>
                  <Input
                    type="text"
                    value={numbering}
                    onChange={(e) => setNumbering(e.target.value)}
                    placeholder="Ex: /199, /999, etc."
                    className="bg-[hsl(216,46%,13%)] border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("recognition")}
                  className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep("confirmation")}
                  disabled={!selectedCollectionId || !playerName || !cardNumber}
                  className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white disabled:bg-gray-600"
                >
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === "confirmation" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-400">Vérifiez les informations avant d'ajouter la carte</p>
              </div>
              
              <div className="bg-[hsl(214,35%,18%)] rounded-lg p-6">
                <div className="flex space-x-6">
                  {editedImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={editedImage}
                        alt="Carte"
                        className="w-32 h-44 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Collection</p>
                      <p className="text-white">{collections.find(c => c.id.toString() === selectedCollectionId)?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Joueur</p>
                      <p className="text-white">{playerName}</p>
                    </div>
                    {teamName && (
                      <div>
                        <p className="text-gray-400 text-sm">Équipe</p>
                        <p className="text-white">{teamName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm">Numéro</p>
                      <p className="text-white">{cardNumber}</p>
                    </div>
                    {numbering && (
                      <div>
                        <p className="text-gray-400 text-sm">Numérotation</p>
                        <p className="text-white">{numbering}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("details")}
                  className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={createCardMutation.isPending}
                  className="flex-1 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)] text-white disabled:bg-gray-600"
                >
                  {createCardMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ajout en cours...
                    </div>
                  ) : (
                    "Ajouter la carte"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}