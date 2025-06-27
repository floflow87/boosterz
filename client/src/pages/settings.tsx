import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Bell, Settings as SettingsIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    avatar: ''
  });

  const { data: currentUser, isLoading } = useQuery<{ user: User }>({
    queryKey: ['/api/users/me']
  });

  useEffect(() => {
    if (currentUser?.user) {
      setFormData({
        name: currentUser.user.name || '',
        username: currentUser.user.username || '',
        email: currentUser.user.email || '',
        bio: currentUser.user.bio || '',
        avatar: currentUser.user.avatar || ''
      });
    }
  }, [currentUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "❌ Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(216,46%,13%)' }}>
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(216,46%,13%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Halo effect behind arrow */}
            <div className="relative">
              <div 
                className="absolute inset-0 w-10 h-10 rounded-full blur-lg opacity-30"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              />
              <button 
                onClick={() => setLocation('/collections')}
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
              BOOSTER<span style={{ color: '#667eea' }}>Z</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Bell className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <SettingsIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white/5 rounded-lg p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-orange-500 bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center overflow-hidden">
              {(formData.avatar || currentUser?.user?.avatar) ? (
                <img 
                  src={formData.avatar || currentUser?.user?.avatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {currentUser?.user?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Paramètres du profil</h2>
            <p className="text-gray-400">Gérez vos informations personnelles</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo de profil
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Votre nom complet"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="@votre_username"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Biographie
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                maxLength={200}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Parlez-nous de vous..."
              />
              <div className="text-right text-sm text-gray-400 mt-1">
                {formData.bio.length}/200
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {updateProfileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}