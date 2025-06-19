import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, Edit, Save, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HaloBlur from "@/components/halo-blur";
import LoadingScreen from "@/components/LoadingScreen";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    address: "",
    city: "",
    bio: "",
    avatar: ""
  });

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users/1"]
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      return await apiRequest("PUT", "/api/users/1", userData);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1"] });
      queryClient.setQueryData(["/api/users/1"], updatedUser);
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive"
      });
    }
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Erreur",
          description: "La taille de l'image ne doit pas dépasser 5MB.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: base64Image }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        bio: user.bio || "",
        avatar: user.avatar || ""
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
      username: "",
      phone: "",
      address: "",
      city: "",
      bio: "",
      avatar: ""
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden">
      <HaloBlur />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-12">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setLocation("/settings")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-semibold">Mon Profil</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="p-2 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] rounded-lg transition-colors"
              >
                <Save className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Edit className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      <main className="relative z-10 px-4 pb-24">
        {/* Photo de profil */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-[hsl(9,85%,67%)] to-orange-500 rounded-full flex items-center justify-center mb-4">
              {(isEditing && formData.avatar) || user?.avatar ? (
                <img 
                  src={isEditing && formData.avatar ? formData.avatar : user?.avatar || ""} 
                  alt="Avatar"
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            {isEditing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 bg-[hsl(9,85%,67%)] rounded-full shadow-lg hover:bg-[hsl(9,85%,60%)] transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Informations du profil */}
        <div className="space-y-6">
          {/* Informations de base */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-[hsl(9,85%,67%)]">Informations personnelles</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom complet</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <p className="text-white">{user?.name || "Non renseigné"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom d'utilisateur</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <p className="text-white">@{user?.username || "Non renseigné"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <p className="text-white">{user?.email || "Non renseigné"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <p className="text-white">{user?.phone || "Non renseigné"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-[hsl(9,85%,67%)]">Adresse</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <p className="text-white">{user?.address || "Non renseigné"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <p className="text-white">{user?.city || "Non renseigné"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-[hsl(9,85%,67%)]">À propos</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Biographie</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] resize-none"
                  placeholder="Parlez-nous de vous, de vos collections préférées..."
                />
              ) : (
                <p className="text-white">{user?.bio || "Aucune biographie renseignée"}</p>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-[hsl(9,85%,67%)]">Statistiques</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{user?.totalCards || 0}</div>
                <div className="text-sm text-gray-400">Cartes totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{user?.collectionsCount || 0}</div>
                <div className="text-sm text-gray-400">Collections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{user?.completionPercentage || 0}%</div>
                <div className="text-sm text-gray-400">Complétude</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{user?.followersCount || 0}</div>
                <div className="text-sm text-gray-400">Abonnés</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}