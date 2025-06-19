import { Loader2 } from "lucide-react";
import goldenCardsImage from "@assets/image_1750362723156.png";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div 
      className="fixed inset-0 bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ 
        backgroundImage: `url(${goldenCardsImage})`,
        backgroundColor: '#1a1a1a' // Fallback color
      }}
    >
      <div className="bg-black/60 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-[hsl(9,85%,67%)] animate-spin" />
        {message && <p className="text-white text-lg font-medium">{message}</p>}
      </div>
    </div>
  );
}