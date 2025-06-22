import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  User, 
  Camera, 
  Save, 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";
import avatarImage from "@assets/image_1750196240581.png";

export default function Profile() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    bio: "",
    avatar: ""
  });
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/users/1"],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
        country: user.country || "",
        bio: (user as any).bio || "",
        avatar: (user as any).avatar || ""
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/users/1", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1"] });
      toast({ title: "Profil mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20 relative overflow-hidden">
      <HaloBlur />
      
      <div className="relative z-10">
        <Header title="Mon Profil" />
        
        <main className="px-4 pb-24">
          <div className="max-w-md mx-auto">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8 mt-6">
              <div className="relative mb-4">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.avatar || user?.avatar ? (
                    <img 
                      src={formData.avatar || user?.avatar || avatarImage} 
                      alt="Avatar"
                      className="w-32 h-32 object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-[hsl(9,85%,67%)] rounded-full p-3 cursor-pointer hover:bg-[hsl(9,85%,60%)] transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">
                {user?.name || user?.username || "Utilisateur"}
              </h2>
              <p className="text-gray-400 text-sm">@{user?.username}</p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Informations personnelles */}
              <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Edit3 className="w-5 h-5 mr-2 text-[hsl(9,85%,67%)]" />
                  Informations personnelles
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Nom complet
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-gray-300">
                      Nom d'utilisateur
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                      placeholder="Votre nom d'utilisateur"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-300">
                      Biographie
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1 resize-none"
                      rows={3}
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-[hsl(9,85%,67%)]" />
                  Contact
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-[hsl(9,85%,67%)]" />
                  Adresse
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-300">
                      Adresse
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                      placeholder="123 rue de la Paix"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-300">
                        Ville
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                        placeholder="Paris"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-300">
                        Code postal
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                        placeholder="75001"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-gray-300">
                      Pays
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className="bg-[hsl(214,35%,18%)] border-gray-600 text-white mt-1"
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="w-full bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] py-3 text-white font-medium rounded-lg transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>

            </form>
          </div>
        </main>
      </div>

      <Navigation />
    </div>
  );
}