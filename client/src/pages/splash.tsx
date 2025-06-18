import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import HaloBlur from "@/components/halo-blur";
import paniniLogo from "@assets/panini-group-logo 1_1750197572668.png";

export default function Splash() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    // Simulate loading time before navigation
    setTimeout(() => {
      setLocation("/collections");
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <div className="flex flex-col items-center justify-center h-screen text-center relative z-10 px-4">
        <div className="mb-8">
          <div className="w-[576px] h-40 mb-4 mx-auto flex items-center justify-center">
            <img 
              src={paniniLogo} 
              alt="Panini Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white font-luckiest">COLLECTION CARDS</h1>
          <p className="text-[hsl(212,23%,69%)] font-poppins">Gérez vos collections de cartes Panini</p>
        </div>
        
        <div className="mt-16">
          <button 
            onClick={handleStart}
            disabled={isLoading}
            className={`w-full max-w-xs py-4 px-6 rounded-2xl font-semibold transition-all shadow-lg ${
              isLoading 
                ? "bg-gray-600 text-gray-300 cursor-not-allowed" 
                : "bg-[hsl(9,85%,67%)] text-white hover:bg-opacity-90 hover:shadow-xl transform hover:scale-105"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : (
              "Commencer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
