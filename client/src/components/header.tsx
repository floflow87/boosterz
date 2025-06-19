import { ArrowLeft, Bell } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function Header({ title, showBackButton = false }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/collections");
  };

  return (
    <header className="relative z-10 flex items-center justify-between p-4 pt-4">
      <div className="flex items-center space-x-3">
        {showBackButton ? (
          <button 
            onClick={handleBack}
            className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[hsl(212,23%,69%)]" />
          </button>
        ) : null}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-[hsl(212,23%,69%)]" />
        </button>
      </div>
    </header>
  );
}
