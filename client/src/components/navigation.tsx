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
              className={`nav-item flex flex-col items-center p-2 transition-all duration-300 h-14 justify-center relative ${
                active 
                  ? "text-[#F37261]" 
                  : "text-white hover:text-[#F37261]"
              }`}
            >
              {/* Border bottom pour l'onglet actif */}
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#F37261] rounded-t-full transition-all duration-300" />
              )}
              
              <Icon className={`w-5 h-5 ${active ? 'scale-105' : ''} transition-transform duration-200`} />
              {!active && (
                <span className="text-xs mt-1 text-gray-400">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
