import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Mail, Phone, MapPin, Edit3, Save, X } from "lucide-react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    bio: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/auth/me"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserType>) => apiRequest("/api/auth/profile", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
        country: user.country || "",
        bio: user.bio || ""
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
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      bio: ""
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(9,85%,67%)]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Utilisateur introuvable</h2>
          <button
            onClick={() => setLocation("/collections")}
            className="bg-[hsl(9,85%,67%)] text-white px-6 py-3 rounded-lg hover:bg-[hsl(9,85%,60%)] transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(216,46%,13%)] border-b border-[hsl(216,46%,20%)]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLocation("/collections")}
              className="p-2 rounded-lg bg-[hsl(216,46%,20%)] hover:bg-[hsl(216,46%,25%)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Paramètres</h1>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-2 rounded-lg bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 space-y-6">
        {/* Avatar and basic info */}
        <div className="bg-[hsl(216,46%,18%)] rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-gray-400">
                {user.totalCards} cartes • {user.collectionsCount} collections
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{user.totalCards}</div>
              <div className="text-sm text-gray-400">Cartes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{user.collectionsCount}</div>
              <div className="text-sm text-gray-400">Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{user.completionPercentage}%</div>
              <div className="text-sm text-gray-400">Complété</div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-[hsl(216,46%,18%)] rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Informations personnelles</h3>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                />
              ) : (
                <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                  {user.name || "Non renseigné"}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                />
              ) : (
                <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                  {user.email || "Non renseigné"}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                />
              ) : (
                <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                  {user.phone || "Non renseigné"}
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Adresse
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                />
              ) : (
                <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                  {user.address || "Non renseigné"}
                </div>
              )}
            </div>

            {/* City and Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                    {user.city || "Non renseigné"}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                  />
                ) : (
                  <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                    {user.postalCode || "Non renseigné"}
                  </div>
                )}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pays</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                />
              ) : (
                <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300">
                  {user.country || "Non renseigné"}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Biographie</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                  className="w-full p-3 bg-[hsl(216,46%,25%)] border border-[hsl(216,46%,30%)] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] resize-none"
                />
              ) : (
                <div className="p-3 bg-[hsl(216,46%,25%)] rounded-lg text-gray-300 min-h-[80px]">
                  {user.bio || "Aucune biographie renseignée"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-[hsl(216,46%,18%)] rounded-lg p-6">
          <button
            onClick={() => window.location.href = '/api/auth/logout'}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
}