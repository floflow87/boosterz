import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Save, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Récupérer les données de l'utilisateur actuel
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/me']
  });

  const currentUser = authData?.user;

  // Mettre à jour les champs quand les données sont chargées
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setBio(currentUser.bio || "");
      setAvatar(currentUser.avatar || "");
    }
  }, [currentUser]);

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<UserProfile>) => {
      const response = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été sauvegardées avec succès.",
        className: "bg-green-600 text-white border-green-700",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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
    updateProfileMutation.mutate({
      name,
      email,
      bio,
      avatar
    });
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
      
      <div className="relative z-10 p-4 space-y-6 max-w-2xl mx-auto">
        {/* Photo de profil */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold font-luckiest flex items-center space-x-2">
            <User className="w-5 h-5 text-[hsl(9,85%,67%)]" />
            <span>Photo de profil</span>
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white font-bold text-2xl relative overflow-hidden">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                currentUser.name?.charAt(0).toUpperCase() || currentUser.username?.charAt(0).toUpperCase()
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-white font-medium">{currentUser.name} @{currentUser.username}</p>
              <p className="text-gray-400 text-sm">Cliquez sur l'avatar pour changer la photo</p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Informations personnelles</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Nom complet</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsEditing(true);
                }}
                className="bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400"
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEditing(true);
                }}
                className="bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-white">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={currentUser.username}
                disabled
                className="bg-[hsl(214,35%,25%)] border-[hsl(214,35%,35%)] text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">Le nom d'utilisateur ne peut pas être modifié</p>
            </div>

            <div>
              <Label htmlFor="bio" className="text-white">Biographie</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setIsEditing(true);
                }}
                className="bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400"
                placeholder="Parlez-nous de vous..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        {isEditing && (
          <div className="flex justify-center">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-8 py-2"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Button>
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}