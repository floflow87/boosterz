import { useState } from "react";
import { Home, Users, BookOpen, ShoppingCart, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import LoadingScreen from "@/components/LoadingScreen";

const navItems = [
  { id: "home", icon: Home, label: "Accueil", path: "/" },
  { id: "social", icon: Users, label: "Social", path: "/social" },
  { id: "book", icon: BookOpen, label: "Book", path: "/collections" },
  { id: "shop", icon: ShoppingCart, label: "Boutique", path: "/shop" },
  { id: "settings", icon: Settings, label: "Réglages", path: "/settings" },
  { id: "logout", icon: LogOut, label: "Déconnexion", path: "/logout", isLogout: true },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNavigation = (item: any) => {
    if (item.isLogout) {
      setIsLoggingOut(true);
      // Clear authentication
      localStorage.removeItem("authToken");
      // Simulate logout delay
      setTimeout(() => {
        setLocation("/auth");
        setIsLoggingOut(false);
      }, 1000);
    } else {
      setLocation(item.path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/" || location === "/splash";
    }
    if (path === "/collections") {
      return location === "/collections" || location.startsWith("/collection") || location === "/all-cards";
    }
    return location.startsWith(path);
  };

  if (isLoggingOut) {
    return <LoadingScreen />;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-lg px-3 py-4 z-20 shadow-lg rounded-t-[20px]" style={{ backgroundColor: '#131B2F', height: '80px' }}>
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
