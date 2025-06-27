import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Users, Mail, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

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
      <DialogContent className="max-w-md w-full bg-white dark:bg-gray-800 max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="self-end text-blue-600 hover:text-blue-800"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Mail className="w-8 h-8 mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification: NotificationData) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.isRead
                      ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-600"
                  }`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {notification.fromUser?.avatar ? (
                          <img
                            src={
                              notification.fromUser.avatar.startsWith('data:')
                                ? notification.fromUser.avatar
                                : `${notification.fromUser.avatar}`
                            }
                            alt={notification.fromUser.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                            {notification.fromUser?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.fromUser?.name || "Système"}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}