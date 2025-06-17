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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#F37261] backdrop-blur-lg px-4 py-3 z-20 shadow-lg rounded-t-[30px]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`nav-item flex flex-col items-center p-3 transition-all duration-300 ${
                active 
                  ? "text-[#F37261] bg-white rounded-full shadow-lg" 
                  : "text-white hover:bg-white/10 rounded-lg"
              }`}
              style={active ? {
                boxShadow: '0 0 0 8px rgba(243, 114, 97, 0.2)'
              } : {}}
            >
              <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
