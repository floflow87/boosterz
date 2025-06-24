import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Mail, User, Lock, CheckCircle } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("/api/auth/register", "POST", data);
      return response;
    },
    onSuccess: () => {
      setRegistrationComplete(true);
      toast({
        title: "Inscription réussie !",
        description: "Vérifie ton email pour confirmer ton compte",
        className: "bg-green-600 text-white border-green-600",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest(`/api/auth/check-username?username=${username}`, "GET");
      return response;
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Vérification temps réel du pseudo
    if (name === "username" && value.length >= 3) {
      checkUsernameMutation.mutate(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit faire au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const isUsernameAvailable = checkUsernameMutation.data?.available;
  const isUsernameChecking = checkUsernameMutation.isPending;

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(214,35%,8%)] to-[hsl(214,35%,12%)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Inscription réussie !</h1>
            <p className="text-gray-400">
              Un email de confirmation a été envoyé à <span className="text-yellow-400">{formData.email}</span>
            </p>
          </div>

          <div className="bg-[hsl(214,35%,15%)] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Prochaines étapes :</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold">1</div>
                <span>Vérifie ton email et clique sur le lien</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <span>Connecte-toi à ton compte</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                <span>Commence ton aventure BOOSTERZ !</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setLocation("/auth")}
            variant="outline"
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(214,35%,8%)] to-[hsl(214,35%,12%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 font-luckiest">BOOSTERZ</h1>
          <p className="text-gray-400">Rejoins la communauté de collectionneurs</p>
        </div>

        {/* Formulaire d'inscription */}
        <div className="bg-[hsl(214,35%,15%)] rounded-xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/auth")}
              className="text-gray-400 hover:text-white p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold text-white">Créer un compte</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pseudo */}
            <div>
              <Label htmlFor="username" className="text-white mb-2 block">
                <User className="w-4 h-4 inline mr-2" />
                Pseudo
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-[hsl(214,35%,10%)] border-gray-600 text-white pr-10"
                  placeholder="TonPseudo"
                  required
                  minLength={3}
                />
                {formData.username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isUsernameChecking ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : isUsernameAvailable ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 bg-red-500 rounded-full" />
                    )}
                  </div>
                )}
              </div>
              {formData.username.length >= 3 && !isUsernameChecking && (
                <p className={`text-sm mt-1 ${isUsernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                  {isUsernameAvailable ? 'Pseudo disponible !' : 'Ce pseudo est déjà pris'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-white mb-2 block">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-[hsl(214,35%,10%)] border-gray-600 text-white"
                placeholder="ton@email.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <Label htmlFor="password" className="text-white mb-2 block">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-[hsl(214,35%,10%)] border-gray-600 text-white pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
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

            {/* Confirmation mot de passe */}
            <div>
              <Label htmlFor="confirmPassword" className="text-white mb-2 block">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-[hsl(214,35%,10%)] border-gray-600 text-white pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              disabled={registerMutation.isPending || (formData.username.length >= 3 && !isUsernameAvailable)}
            >
              {registerMutation.isPending ? "Inscription..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{" "}
              <button
                onClick={() => setLocation("/auth")}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}