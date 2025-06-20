import { ArrowLeft, Bell, MessageCircle } from "lucide-react";
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
}

export default function Header({ title, showBackButton = false }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/collections");
  };

  // Get conversations to check for unread messages
  const { data: conversations = [] } = useQuery<ConversationItem[]>({
    queryKey: ['/api/chat/conversations'],
    refetchInterval: 5000,
  });

  const hasUnreadMessages = conversations.some(conv => conv.unreadCount > 0);

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
        <button 
          onClick={() => setLocation('/conversations')}
          className="relative w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5 text-[hsl(212,23%,69%)]" />
          {hasUnreadMessages && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(9,85%,67%)] rounded-full"></div>
          )}
        </button>
        <button className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-[hsl(212,23%,69%)]" />
        </button>
      </div>
    </header>
  );
}
