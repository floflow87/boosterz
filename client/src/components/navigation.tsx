import { Home, Users, CreditCard, ShoppingCart, Settings } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { id: "home", icon: Home, label: "Menu List", path: "/collections" },
  { id: "social", icon: Users, label: "Menu List", path: "/social" },
  { id: "cards", icon: CreditCard, label: "Menu List", path: "/cards" },
  { id: "shop", icon: ShoppingCart, label: "Menu List", path: "/shop" },
  { id: "settings", icon: Settings, label: "Menu List", path: "/settings" },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/collections") {
      return location === "/" || location === "/collections";
    }
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[hsl(214,35%,22%)] border-t border-gray-700 px-4 py-3 z-20">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`nav-item flex flex-col items-center space-y-1 ${
                active ? "active text-[hsl(9,85%,67%)]" : "text-[hsl(212,23%,69%)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
