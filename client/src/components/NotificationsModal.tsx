import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Users, Mail, CheckCheck, ArrowLeft, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface NotificationData {
  id: number;
  type: "like" | "comment" | "message" | "follow";
  title: string;
  message: string;
  isRead: boolean;
  fromUser?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="w-5 h-5 text-red-500" />;
    case "comment":
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case "message":
      return <Mail className="w-5 h-5 text-green-500" />;
    case "follow":
      return <Users className="w-5 h-5 text-purple-500" />;
    default:
      return <Mail className="w-5 h-5 text-gray-500" />;
  }
};

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch notifications (with mock data for now)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
    initialData: [
      {
        id: 1,
        type: "like",
        title: "Nouveau like",
        message: "a aimé votre post",
        isRead: false,
        fromUser: {
          id: 999,
          name: "Mac la menace",
          username: "maxlamenace",
          avatar: undefined
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 2,
        type: "comment",
        title: "Nouveau commentaire",
        message: "a commenté votre post : \"Belle carte !\"",
        isRead: false,
        fromUser: {
          id: 999,
          name: "Mac la menace",
          username: "maxlamenace",
          avatar: undefined
        },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        id: 3,
        type: "follow",
        title: "Nouvel abonné",
        message: "a commencé à vous suivre",
        isRead: true,
        fromUser: {
          id: 999,
          name: "Mac la menace",
          username: "maxlamenace",
          avatar: undefined
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: 4,
        type: "message",
        title: "Nouveau message",
        message: "vous a envoyé un message",
        isRead: true,
        fromUser: {
          id: 999,
          name: "Mac la menace",
          username: "maxlamenace",
          avatar: undefined
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    ]
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest("/api/notifications/read-all", "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-full w-full h-full bg-[hsl(216,46%,13%)] border-none p-0 m-0 rounded-none flex flex-col"
        style={{ maxWidth: '100vw', maxHeight: '100vh' }}
      >
        {/* Main color halo effect */}
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(9, 85%, 67%) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Header - identical to other pages */}
        <header className="relative z-10 flex items-center justify-between p-4 pt-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-[hsl(212,23%,69%)]" />
            </button>
            <h1 className="text-lg font-semibold text-white font-luckiest">
              <span className="text-white">Booster</span>
              <span className="text-[hsl(9,85%,67%)]">z</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setLocation('/settings')}
              className="w-10 h-10 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-[hsl(212,23%,69%)]" />
            </button>
          </div>
        </header>

        {/* Content Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="bg-[hsl(9,85%,67%)] text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-[hsl(9,85%,67%)] hover:text-white hover:bg-[hsl(214,35%,22%)]"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Chargement...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Mail className="w-8 h-8 mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`bg-[hsl(214,35%,22%)] rounded-lg border cursor-pointer transition-colors p-4 ${
                    notification.isRead
                      ? "border-[hsl(214,35%,30%)] opacity-75"
                      : "border-[hsl(9,85%,67%)] shadow-sm"
                  }`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {notification.fromUser?.avatar ? (
                          <img
                            src={
                              notification.fromUser.avatar.startsWith('data:')
                                ? notification.fromUser.avatar
                                : `${notification.fromUser.avatar}`
                            }
                            alt={notification.fromUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                            {notification.fromUser?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium text-white truncate">
                          {notification.fromUser?.name || "Système"}
                        </span>
                        {!notification.isRead && (
                          <div className="w-3 h-3 bg-[hsl(9,85%,67%)] rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}