import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, User, Mail, Lock, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import HaloBlur from "@/components/halo-blur";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.name}!`,
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      toast({
        title: "Compte créé",
        description: `Bienvenue ${data.user.name}!`,
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#111827]">
      <div className="w-full max-w-md">
        <div className="rounded-xl p-8 shadow-2xl border border-gray-800 bg-[24354C] font-light">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "Connexion" : "Inscription"}
            </h1>
            <p className="text-gray-400">
              {mode === "login" 
                ? "Connectez-vous à votre compte" 
                : "Créez votre compte pour commencer"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "register" && (
              <>
                <div>
                  <Label htmlFor="username" className="text-white mb-2 block">
                    Nom d'utilisateur
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => updateFormData("username", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                      placeholder="Votre nom d'utilisateur"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name" className="text-white mb-2 block">
                    Nom complet
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Votre nom complet"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-white mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white pl-10"
                  placeholder="votre@email.com"
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

            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-white mb-2 block">
                      Téléphone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-white mb-2 block">
                      Pays
                    </Label>
                    <Input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={(e) => updateFormData("country", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="France"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-white mb-2 block">
                    Adresse
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                      placeholder="Votre adresse (optionnel)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-white mb-2 block">
                      Ville
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Votre ville"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-white mb-2 block">
                      Code postal
                    </Label>
                    <Input
                      id="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData("postalCode", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="12345"
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full"
              style={{ backgroundColor: '#F37261' }}
            >
              {(loginMutation.isPending || registerMutation.isPending) 
                ? "Chargement..." 
                : mode === "login" ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="ml-2 text-[#F37261] hover:underline"
              >
                {mode === "login" ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}