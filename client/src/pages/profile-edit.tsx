import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Camera, Save, User, Settings } from "lucide-react";
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
      
      <div className="relative z-10 p-4">
        <Tabs defaultValue="informations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[hsl(214,35%,22%)] mb-6">
            <TabsTrigger 
              value="informations" 
              className="data-[state=active]:bg-[hsl(9,85%,67%)] data-[state=active]:text-white text-gray-400"
            >
              <User className="w-4 h-4 mr-2" />
              Informations
            </TabsTrigger>
            <TabsTrigger 
              value="parametres" 
              className="data-[state=active]:bg-[hsl(9,85%,67%)] data-[state=active]:text-white text-gray-400"
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="space-y-6">
            {/* Photo de profil */}
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-bold font-luckiest">Photo de profil</h2>
              
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white font-bold text-2xl relative overflow-hidden">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (firstName?.charAt(0) || currentUser.username?.charAt(0) || "U").toUpperCase()
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
                  <p className="text-white font-medium">{firstName} {lastName}</p>
                  <p className="text-gray-400 text-sm">@{username}</p>
                  <p className="text-gray-500 text-xs mt-1">Cliquez pour modifier</p>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-bold font-luckiest">Informations personnelles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setIsEditing(true);
                    }}
                    className="bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-white">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setIsEditing(true);
                    }}
                    className="bg-[hsl(214,35%,30%)] border-[hsl(214,35%,40%)] text-white placeholder-gray-400"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-white">Pseudo</Label>
                  <Input
                    id="username"
                    value={username}
                    disabled
                    className="bg-[hsl(214,35%,25%)] border-[hsl(214,35%,35%)] text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Non modifiable</p>
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
              </div>

              {/* Bouton de sauvegarde */}
              {isEditing && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-8 py-2"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="parametres" className="space-y-6">
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6">
              <h2 className="text-lg font-bold font-luckiest mb-4">Paramètres du compte</h2>
              <p className="text-gray-400">Fonctionnalités à venir...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Navigation />
    </div>
  );
}