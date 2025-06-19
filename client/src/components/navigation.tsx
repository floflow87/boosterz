import { Home, Users, BookOpen, ShoppingCart, Settings } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { id: "home", icon: Home, label: "Accueil", path: "/" },
  { id: "social", icon: Users, label: "Social", path: "/social" },
  { id: "book", icon: BookOpen, label: "Book", path: "/collections" },
  { id: "shop", icon: ShoppingCart, label: "Boutique", path: "/shop" },
  { id: "settings", icon: Settings, label: "Réglages", path: "/settings" },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/" || location === "/splash";
    }
    if (path === "/collections") {
      return location === "/collections" || location.startsWith("/collection") || location === "/all-cards";
    }
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-lg px-3 py-4 z-20 shadow-lg rounded-t-[20px]" style={{ backgroundColor: '#131B2F', height: '80px' }}>
      <div className="flex justify-around items-center max-w-sm mx-auto h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
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
