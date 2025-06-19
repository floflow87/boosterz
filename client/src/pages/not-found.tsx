import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-[hsl(9,85%,67%)] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Page introuvable</h1>
          <p className="text-gray-400 mb-6">
            La page que vous cherchez n'existe pas.
          </p>
          <button
            onClick={() => setLocation("/collections")}
            className="bg-[hsl(9,85%,67%)] text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto hover:bg-[hsl(9,85%,60%)] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
