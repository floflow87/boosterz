import { useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, Layers } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import HaloBlur from "@/components/halo-blur";

export default function Start() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const completeFirstLoginMutation = useMutation({
    mutationFn: () => apiRequest("/api/auth/complete-first-login", "POST"),
    onSuccess: () => {
      // Invalidate user query to update isFirstLogin status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/collections");
    },
  });

  const handleStart = () => {
    completeFirstLoginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden">
      <HaloBlur />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo/Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <div className="relative">
            <CreditCard className="w-12 h-12 text-white absolute -rotate-12" />
            <CreditCard className="w-12 h-12 text-white/80 absolute rotate-12 translate-x-2" />
            <Layers className="w-8 h-8 text-white/60 absolute bottom-0 right-0" />
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-5xl mb-4 text-[hsl(9,85%,67%)]" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
          Bienvenue !
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Gérez votre collection de cartes
        </p>
        <p className="text-lg text-gray-400 mb-12 max-w-md">
          Découvrez, collectionnez et échangez vos cartes préférées avec la communauté
        </p>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={completeFirstLoginMutation.isPending}
          className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[hsl(9,85%,67%)] to-white text-[hsl(9,85%,67%)] font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {completeFirstLoginMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-[hsl(9,85%,67%)] border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <CreditCard className="w-5 h-5 mr-2" />
          )}
          Commencer
        </button>
      </div>
    </div>
  );
}