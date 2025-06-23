import { useState } from "react";
import { Users, BookOpen, MessageCircle, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import LoadingScreen from "@/components/LoadingScreen";

const navItems = [
  { id: "community", icon: Users, label: "Communauté", path: "/community" },
  { id: "collections", icon: BookOpen, label: "Collections", path: "/collections" },
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
    if (path === "/community") {
      return location === "/" || location === "/community";
    }
    if (path === "/collections") {
      return location === "/collections" || location.startsWith("/collection") || location === "/all-cards" || location.startsWith("/deck");
    }
    if (path === "/conversations") {
      return location === "/conversations" || location.startsWith("/chat");
    }
    return location.startsWith(path);
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
              className={`nav-item flex flex-col items-center p-2 transition-all duration-300 ${
                active 
                  ? "text-[#F37261] rounded-full" 
                  : "text-white hover:bg-gray-700 rounded-lg"
              }`}
              style={active ? {
                boxShadow: '0 0 0 6px rgba(243, 114, 97, 0.15)'
              } : {}}
            >
              <Icon className={`w-5 h-5 ${active ? 'scale-105' : ''} transition-transform`} />
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
