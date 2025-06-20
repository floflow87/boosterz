import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import MessageNotification from "@/components/MessageNotification";

interface NotificationMessage {
  id: number;
  senderName: string;
  content: string;
  conversationId: number;
  timestamp: string;
}

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

interface NotificationContextType {
  showNotification: (message: NotificationMessage) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [lastMessageCount, setLastMessageCount] = useState<Record<number, number>>({});

  // Monitor all conversations for new messages
  const { data: conversations = [] } = useQuery<ConversationItem[]>({
    queryKey: ['/api/chat/conversations'],
    refetchInterval: 15000, // Reduced frequency from 3s to 15s
    staleTime: 12000, // Cache for 12 seconds
    refetchOnWindowFocus: false,
  });

  // Check for new messages and show notifications
  useEffect(() => {
    if (conversations.length > 0) {
      const newCounts: Record<number, number> = {};
      let hasNewNotifications = false;
      
      conversations.forEach((conv: ConversationItem) => {
        const currentCount = conv.unreadCount || 0;
        const previousCount = lastMessageCount[conv.id] || 0;
        newCounts[conv.id] = currentCount;
        
        if (currentCount > previousCount && conv.lastMessage && !conv.lastMessage.isRead) {
          // Show notification for new message
          const notification: NotificationMessage = {
            id: Date.now() + Math.random(),
            senderName: conv.user.name,
            content: conv.lastMessage.content,
            conversationId: conv.id,
            timestamp: conv.lastMessage.timestamp
          };
          
          setNotifications(prev => [...prev, notification]);
          hasNewNotifications = true;
        }
      });
      
      // Only update if there are actual changes
      if (hasNewNotifications || JSON.stringify(newCounts) !== JSON.stringify(lastMessageCount)) {
        setLastMessageCount(newCounts);
      }
    }
  }, [conversations]);

  const showNotification = (message: NotificationMessage) => {
    setNotifications(prev => [...prev, message]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map(notification => (
        <MessageNotification
          key={notification.id}
          show={true}
          message={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}