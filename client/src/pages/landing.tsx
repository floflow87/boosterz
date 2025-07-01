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
      
      // For login, send username field as backend expects it
      const requestData = isLogin 
        ? { username: data.username, password: data.password }
        : data;
      
      return await apiRequest("POST", endpoint, requestData);
    },
    onSuccess: (response: any) => {
      console.log('Login success response:', response);
      localStorage.setItem('authToken', response.token);
      
      // Ne pas marquer l'onboarding comme terminé - laisser le Router décider
      // localStorage.setItem('onboarding_completed', 'true'); // Supprimé
      
      // Force page reload to trigger router re-evaluation
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && (!formData.name || !formData.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    authMutation.mutate(formData);
  };

  const features = [
    { icon: Star, title: "Collectionnez", description: "Plus de 600 cartes uniques" },
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
          </div>

          {/* Right side - Auth form */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {isLogin ? "Connexion" : "Inscription"}
              </h2>
              <p className="text-gray-400">
                {isLogin ? "Accédez à vos collections" : "Créez votre compte gratuit"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors"
                      placeholder="Votre nom complet"
                      required={!isLogin}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors"
                      placeholder="votre@email.com"
                      required={!isLogin}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[hsl(9,85%,67%)] transition-colors"
                  placeholder="Nom d'utilisateur"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe
                </label>
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
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ username: "", email: "", name: "", password: "" });
                }}
                className="text-[hsl(9,85%,67%)] hover:text-[hsl(9,85%,60%)] transition-colors"
              >
                {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
              </button>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}