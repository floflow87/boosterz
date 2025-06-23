import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (data: any) => {
      localStorage.setItem("authToken", data.token);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.name}!`,
      });
      setLocation("/collections");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show loading screen during login
  if (loginMutation.isPending) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-luckiest text-white">
            BOOSTER<span className="text-[#F37261]">Z</span>
          </h1>
          <p className="text-gray-400 mt-2">Collecte et échange tes cartes</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white mb-2 block">
                Nom d'utilisateur ou Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white pl-10"
                  placeholder="Nom d'utilisateur ou email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white mb-2 block">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white pl-10 pr-10"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#F37261] hover:bg-[#E65A4B] text-white font-semibold py-6"
            >
              {loginMutation.isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center mb-2">Comptes de démonstration :</p>
            <div className="flex flex-col gap-2 text-xs">
              <button
                onClick={() => setFormData({ email: "Floflow87", password: "Test25" })}
                className="text-[#F37261] hover:text-[#E65A4B] transition-colors"
              >
                Floflow87 (avec collections)
              </button>
              <button
                onClick={() => setFormData({ email: "maxlamenace", password: "Test25" })}
                className="text-[#F37261] hover:text-[#E65A4B] transition-colors"
              >
                Max la Menace (compte vide)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}