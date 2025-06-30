import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Save, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import LoadingScreen from "@/components/LoadingScreen";
import TrophyAvatar from "@/components/TrophyAvatar";

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États pour les champs du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Récupérer les données de l'utilisateur actuel
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/me']
  });

  const currentUser = authData?.user || null;

  // Afficher l'écran de chargement
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Mettre à jour les champs quand les données sont chargées
  useEffect(() => {
    if (currentUser) {
      const fullName = currentUser.name || "";
      const nameParts = fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setBio(currentUser.bio || "");
      setAvatar(currentUser.avatar || "");
    }
  }, [currentUser]);

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<UserProfile>) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the current user data with the response from server
      queryClient.setQueryData(['/api/auth/me'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été sauvegardées avec succès.",
        className: "bg-green-600 text-white border-green-700",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil.",
        className: "bg-red-600 text-white border-red-700",
      });
    }
  });

  const handleSave = () => {
    const fullName = `${firstName} ${lastName}`.trim();
    const updateData = {
      name: fullName,
      email,
      bio,
      avatar
    };
    
    updateProfileMutation.mutate(updateData);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatar(result);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Erreur de chargement du profil</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20 relative overflow-hidden">
      <HaloBlur />
      <Header title="Mon Profil" showBackButton />
      
      <div className="relative z-10 p-6 max-w-md mx-auto space-y-8">
        {/* Photo de profil - Zone d'upload ouverte */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold font-luckiest text-white">Photo de profil</h2>
          
          {/* Grande zone d'upload d'avatar avec effets néon */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <TrophyAvatar 
                userId={currentUser?.id}
                avatar={avatar || currentUser?.avatar}
                size="xl"
                className="w-32 h-32"
              />
              
              {/* Bouton d'upload plus grand */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-[hsl(9,85%,67%)] rounded-full p-3 cursor-pointer hover:bg-[hsl(9,85%,60%)] transition-colors shadow-xl border-2 border-white"
              >
                <Camera className="w-6 h-6 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Zone d'upload alternative */}
            <label 
              htmlFor="avatar-upload-alt"
              className="w-full max-w-xs p-4 border-2 border-dashed border-[hsl(214,35%,40%)] rounded-lg cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors text-center"
            >
              <div className="flex flex-col items-center space-y-2">
                <Camera className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-400">Cliquez pour changer votre photo</p>
                <p className="text-xs text-gray-500">ou glissez-déposez une image</p>
              </div>
              <input
                id="avatar-upload-alt"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            
            <div className="text-center">
              <p className="text-white font-medium text-lg">{firstName} {lastName}</p>
              <p className="text-gray-400">@{username}</p>
            </div>
          </div>
        </div>

        {/* Informations - Sans encart */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-luckiest text-white text-center">Informations</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-white text-sm font-medium">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setIsEditing(true);
                }}
                className="mt-2 bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)] h-12"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-white text-sm font-medium">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setIsEditing(true);
                }}
                className="mt-2 bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)] h-12"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-white text-sm font-medium">Pseudo</Label>
              <Input
                id="username"
                value={username}
                disabled
                className="mt-2 bg-[hsl(214,35%,25%)] border-[hsl(214,35%,35%)] text-gray-400 h-12"
              />
              <p className="text-xs text-gray-500 mt-1">Non modifiable</p>
            </div>

            <div>
              <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEditing(true);
                }}
                className="mt-2 bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)] h-12"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-white text-sm font-medium">Description</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setIsEditing(true);
                }}
                maxLength={200}
                rows={3}
                className="mt-2 w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)] rounded-lg px-3 py-2 resize-none"
                placeholder="Décrivez-vous en quelques mots (200 caractères max)..."
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/200 caractères</p>
            </div>

            {/* Bouton de sauvegarde */}
            {isEditing && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-12 py-3 font-medium text-lg h-12"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {updateProfileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}