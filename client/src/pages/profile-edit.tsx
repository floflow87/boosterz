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
      const fullName = currentUser.name || "";
      const nameParts = fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
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
    const fullName = `${firstName} ${lastName}`.trim();
    updateProfileMutation.mutate({
      name: fullName,
      email,
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
      
      <div className="relative z-10 p-4 space-y-6">
        {/* Section Avatar Upload */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6">
          <h2 className="text-lg font-bold font-luckiest mb-4">Photo de profil</h2>
          
          <div className="flex flex-col items-center space-y-4">
            {/* Zone d'upload d'avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (firstName?.charAt(0) || currentUser.username?.charAt(0) || "U").toUpperCase()
                )}
              </div>
              
              {/* Bouton d'upload visible */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-[hsl(9,85%,67%)] rounded-full p-2 cursor-pointer hover:bg-[hsl(9,85%,60%)] transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="text-center">
              <p className="text-white font-medium">{firstName} {lastName}</p>
              <p className="text-gray-400 text-sm">@{username}</p>
              <p className="text-gray-500 text-xs mt-1">Cliquez sur l'icône pour modifier votre photo</p>
            </div>
          </div>
        </div>

        {/* Section Informations */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6">
          <h2 className="text-lg font-bold font-luckiest mb-4">Informations</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white text-sm font-medium">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setIsEditing(true);
                  }}
                  className="mt-1 bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)]"
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
                  className="mt-1 bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)]"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-white text-sm font-medium">Pseudo</Label>
                <Input
                  id="username"
                  value={username}
                  disabled
                  className="mt-1 bg-[hsl(214,35%,25%)] border-[hsl(214,35%,35%)] text-gray-400"
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
                  className="mt-1 bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400 focus:border-[hsl(9,85%,67%)]"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Bouton de sauvegarde */}
            {isEditing && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-8 py-3 font-medium"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
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