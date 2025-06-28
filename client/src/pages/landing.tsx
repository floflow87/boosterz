import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Star, Users, Trophy, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HaloBlur from "@/components/halo-blur";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: ""
  });

  const authMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      return await apiRequest("POST", endpoint, data);
    },
    onSuccess: (response: any) => {
      console.log('Auth success response:', response);
      localStorage.setItem('authToken', response.token);
      
      if (!isLogin) {
        // New user - show onboarding
        toast({
          title: "Compte créé avec succès !",
          description: `Bienvenue ${formData.name || formData.username} !`,
          className: "bg-green-600 border-green-600 text-white",
        });
      } else {
        // Existing user - complete onboarding
        localStorage.setItem('onboarding_completed', 'true');
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue dans votre collection",
          className: "bg-green-600 border-green-600 text-white",
        });
      }
      
      // Force page reload to trigger auth state
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'authentification",
        description: error.message || "Vérifiez vos informations",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate(formData);
  };

  const features = [
    { icon: Star, title: "Collectionnez", description: "Cartes officielles Ligue 1" },
    { icon: Users, title: "Échangez", description: "Communauté active de collectionneurs" },
    { icon: Trophy, title: "Progressez", description: "Complétez vos collections" },
    { icon: TrendingUp, title: "Vendez", description: "Marketplace intégré" }
  ];

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden">
      <HaloBlur />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold font-luckiest mb-4 text-white">
              BOOSTER<span className="text-[hsl(9,85%,67%)]">Z</span>
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              La plateforme de collection de cartes football Score Ligue 1
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <feature.icon className="w-8 h-8 text-[hsl(9,85%,67%)] mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isLogin ? "Se connecter" : "Créer un compte"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors"
                    placeholder="Nom complet"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors"
                  placeholder="Nom d'utilisateur"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors"
                    placeholder="Email"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors pr-10"
                    placeholder="Mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authMutation.isPending}
                className="w-full bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {authMutation.isPending ? "..." : (isLogin ? "Se connecter" : "S'inscrire")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setLocation('/register')}
                className="text-[hsl(9,85%,67%)] hover:text-[hsl(9,85%,60%)] transition-colors"
              >
                Se créer un compte
              </button>
              
              <div className="mt-4">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ username: "", email: "", name: "", password: "" });
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {isLogin ? "Autre mode de connexion" : "Retour à la connexion"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}