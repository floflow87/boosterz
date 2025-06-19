import { useState } from "react";
import { useLocation } from "wouter";
import { Play, Star, Trophy, Users } from "lucide-react";
import HaloBlur from "@/components/halo-blur";

export default function Start() {
  const [, setLocation] = useLocation();

  const handleStart = () => {
    setLocation("/collections");
  };

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden flex flex-col">
      <HaloBlur />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center">
        {/* Logo/Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-[hsl(9,85%,67%)] to-orange-500 rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <Trophy className="w-16 h-16 text-white" />
        </div>

        {/* Welcome Text */}
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[hsl(9,85%,67%)] to-orange-400 bg-clip-text text-transparent">
          Bienvenue !
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Gérez votre collection de cartes
        </p>
        <p className="text-lg text-gray-400 mb-12 max-w-md">
          Découvrez, collectionnez et échangez vos cartes préférées avec la communauté
        </p>

        {/* Features */}
        <div className="flex justify-center space-x-8 mb-12">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">Collections</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Communauté</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Échanges</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[hsl(9,85%,67%)] to-orange-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Play className="w-5 h-5 mr-2" />
          Commencer
        </button>
      </div>
    </div>
  );
}