import { useState } from "react";
import { Users, BookOpen, MessageCircle, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import LoadingScreen from "@/components/LoadingScreen";

const navItems = [
  { id: "community", icon: Users, label: "Communauté", path: "/social" },
  { id: "collections", icon: BookOpen, label: "Mes cartes", path: "/collections" },
  { id: "messages", icon: MessageCircle, label: "Messages", path: "/conversations" },
  { id: "shop", icon: ShoppingCart, label: "Boutique", path: "/shop" },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNavigation = (item: any) => {
    if (item.id === "shop") {
      window.open("https://www.panini.fr/shp_fra_fr/cartes-stickers.html?skip_default_filters=true", "_blank");
    } else {
      setLocation(item.path);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (path: string) => {
    switch (path) {
      case "/social":
        return location === "/" || location === "/community" || location === "/social";
      
      case "/collections":
        return location === "/collections" || 
               location.startsWith("/collection") || 
               location === "/all-cards" || 
               location.startsWith("/deck");
      
      case "/conversations":
        return location === "/conversations" || location.startsWith("/chat");
      
      case "/shop":
        return false; // External link, never active
      
      default:
        return false;
    }
  };

  if (isLoggingOut) {
    return <LoadingScreen />;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-lg px-3 py-3 z-20 shadow-lg rounded-t-[20px]" style={{ backgroundColor: '#131B2F', height: '65px' }}>
      <div className="flex justify-around items-center max-w-sm mx-auto h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`nav-item flex flex-col items-center transition-all duration-500 ease-in-out h-14 justify-center relative ${
                active 
                  ? "text-white" 
                  : "text-white hover:text-[#F37261] p-2"
              }`}
            >
              {/* Cercle de fond animé pour l'état actif */}
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ease-in-out ${
                active 
                  ? "bg-[#F37261] scale-100 opacity-100 shadow-lg shadow-[#F37261]/30" 
                  : "bg-transparent scale-75 opacity-0"
              }`} />
              
              {/* Icône */}
              <Icon className={`w-5 h-5 relative z-10 transition-all duration-300 ${
                active ? 'scale-110' : 'scale-100 hover:scale-105'
              }`} />
              
              {/* Label avec animation de fade */}
              <span className={`text-xs mt-1 text-gray-400 relative z-10 transition-all duration-300 ${
                active 
                  ? 'opacity-0 translate-y-1' 
                  : 'opacity-100 translate-y-0'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
        

      </div>
    </nav>
  );
}
