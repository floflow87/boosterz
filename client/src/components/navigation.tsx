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

  // Calculer la position du background animé
  const getActiveIndex = () => {
    return navItems.findIndex(item => isActive(item.path));
  };

  const activeIndex = getActiveIndex();

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-lg px-3 py-3 z-20 shadow-lg rounded-t-[20px]" style={{ backgroundColor: '#131B2F', height: '65px' }}>
      <div className="flex justify-around items-center max-w-sm mx-auto h-full relative">
        {/* Background animé qui se déplace */}
        <div 
          className="absolute h-14 w-14 rounded-full transition-all duration-700 ease-out"
          style={{
            backgroundColor: 'rgba(243, 114, 97, 0.2)',
            left: `${activeIndex * 25}%`,
            transform: 'translateX(-50%)',
            boxShadow: '0 0 20px rgba(243, 114, 97, 0.3), inset 0 0 20px rgba(243, 114, 97, 0.1)',
            border: '1px solid rgba(243, 114, 97, 0.3)'
          }}
        />
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`nav-item flex flex-col items-center transition-all duration-300 ease-out h-14 justify-center relative z-10 ${
                active 
                  ? "text-white" 
                  : "text-white hover:text-[#F37261]"
              }`}
            >
              {/* Icône avec effet de rebond */}
              <Icon className={`w-5 h-5 transition-all duration-300 ease-out ${
                active 
                  ? 'scale-110 drop-shadow-lg' 
                  : 'scale-100 hover:scale-105 hover:drop-shadow-md'
              }`} />
              
              {/* Label avec animation slide et fade */}
              <span className={`text-xs mt-1 text-gray-400 transition-all duration-300 ease-out ${
                active 
                  ? 'opacity-0 translate-y-2 scale-90' 
                  : 'opacity-100 translate-y-0 scale-100'
              }`}>
                {item.label}
              </span>
              
              {/* Particules d'effet pour l'onglet actif */}
              {active && (
                <>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#F37261] rounded-full animate-ping opacity-40" />
                  <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-[#F37261] rounded-full animate-pulse opacity-60" />
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
