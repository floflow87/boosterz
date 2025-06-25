import { ArrowLeft, Settings, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface ConversationItem {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Header({ title, showBackButton = false, onBack }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation("/collections");
    }
  };

  // Get conversations to check for unread messages
  const { data: conversations = [] } = useQuery<ConversationItem[]>({
    queryKey: ['/api/chat/conversations'],
    refetchInterval: 10000, // Reduced frequency from 3s to 10s
    staleTime: 8000, // Cache for 8 seconds
    refetchOnWindowFocus: false,
  });

  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

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
        <h1 className="text-lg font-semibold text-white font-luckiest">
          <span className="text-white">Booster</span>
          <span className="text-[hsl(9,85%,67%)]">z</span>
        </h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setLocation('/notifications')}
          className="relative w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-[hsl(212,23%,69%)]" />
          {totalUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{totalUnreadCount}</span>
            </div>
          )}
        </button>
        <button 
          onClick={() => setLocation('/settings')}
          className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center"
        >
          <Settings className="w-5 h-5 text-[hsl(212,23%,69%)]" />
        </button>
      </div>
    </header>
  );
}
