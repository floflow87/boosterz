import { useLocation } from "wouter";
import HaloBlur from "@/components/halo-blur";
import paniniLogo from "@assets/panini-group-logo 1_1750197572668.png";

export default function Splash() {
  const [, setLocation] = useLocation();

  const handleStart = () => {
    setLocation("/collections");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <div className="flex flex-col items-center justify-center h-screen text-center relative z-10 px-4">
        <div className="mb-8">
          <div className="w-56 h-16 mb-4 mx-auto flex items-center justify-center">
            <img 
              src={paniniLogo} 
              alt="Panini Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white font-luckiest">COLLECTION CARDS</h1>
          <p className="text-[hsl(212,23%,69%)] font-poppins">Gérez vos collections de cartes Panini</p>
        </div>
        
        <button 
          onClick={handleStart}
          className="w-full max-w-xs bg-[hsl(9,85%,67%)] text-white py-4 rounded-2xl font-semibold hover:bg-opacity-90 transition-all"
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
