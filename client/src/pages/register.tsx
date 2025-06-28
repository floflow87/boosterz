import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Star, Users, Trophy, TrendingUp, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HaloBlur from "@/components/halo-blur";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (formData.username.length < 3) {
      newErrors.username = "Le nom d'utilisateur doit faire au moins 3 caractères";
    }

    if (!formData.name) {
      newErrors.name = "Le nom est requis";
    }

    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit faire au moins 6 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { confirmPassword, ...registrationData } = data;
      return await apiRequest("POST", "/api/auth/register", registrationData);
    },
    onSuccess: (response: any) => {
      console.log('Registration success response:', response);
      localStorage.setItem('authToken', response.token);
      
      toast({
        title: "Compte créé avec succès !",
        description: `Bienvenue ${formData.name} !`,
        className: "bg-green-600 border-green-600 text-white",
      });
      
      // Redirection vers les collections
      window.location.href = '/collections';
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création du compte",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    registerMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div 
      className="min-h-screen p-4 relative overflow-hidden"
      style={{ backgroundColor: 'hsl(216,46%,13%)' }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 opacity-20 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 opacity-15 bg-orange-500 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
            BOOSTER<span style={{ color: 'hsl(var(--primary))' }}>Z</span>
          </h1>
        </div>

        {/* Registration form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Créer un compte
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ton nom d'utilisateur"
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ton nom et prénom"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="ton.email@exemple.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Confirme ton mot de passe"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Déjà un compte ?{" "}
              <button
                onClick={() => setLocation('/')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-white/80 text-sm">Communauté</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-white/80 text-sm">Trophées</p>
          </div>
        </div>
      </div>
    </div>
  );
}