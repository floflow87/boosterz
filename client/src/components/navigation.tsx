import { Home, Users, BookOpen, ShoppingCart, Settings } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { id: "home", icon: Home, label: "Accueil", path: "/" },
  { id: "community", icon: Users, label: "Communauté", path: "/community" },
  { id: "book", icon: BookOpen, label: "Book", path: "/collections" },
  { id: "shop", icon: ShoppingCart, label: "Shop", path: "/shop" },
  { id: "settings", icon: Settings, label: "Réglages", path: "/settings" },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/" || location === "/splash";
    }
    if (path === "/collections") {
      return location === "/collections" || location.startsWith("/collection") || location === "/all-cards" || location === "/checklist";
    }
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111B31] backdrop-blur-lg border-t border-[#F37261]/20 px-2 py-2 z-20">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`nav-item flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                active 
                  ? "bg-[#F37261]/20 text-[#F37261]" 
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
