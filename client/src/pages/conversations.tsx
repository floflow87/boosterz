import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, MoreVertical, UserX, UserCheck, Ban, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LoadingScreen from "@/components/LoadingScreen";
import Navigation from "@/components/navigation";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ConversationItem {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  isBlocked?: boolean;
}

export default function Conversations() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations from API
  const { data: conversations = [], isLoading } = useQuery<ConversationItem[]>({
    queryKey: ['/api/chat/conversations'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Block/Unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: 'block' | 'unblock' }) => {
      return apiRequest("POST", `/api/users/${userId}/${action}`, {});
    },
    onSuccess: (_, { userId, action }) => {
      const newBlockedUsers = new Set(blockedUsers);
      if (action === 'block') {
        newBlockedUsers.add(userId);
      } else {
        newBlockedUsers.delete(userId);
      }
      setBlockedUsers(newBlockedUsers);
      
      toast({
        title: action === 'block' ? "Utilisateur bloqué" : "Utilisateur débloqué",
        description: action === 'block' 
          ? "Vous ne recevrez plus de messages de cet utilisateur"
          : "Vous pouvez maintenant recevoir des messages de cet utilisateur",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de blocage",
        variant: "destructive",
      });
    },
  });

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString("fr-FR", { 
        day: "numeric", 
        month: "short" 
      });
    }
  };

  const handleConversationClick = (userId: number) => {
    // Save blocked status to localStorage for chat page
    localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
    setLocation(`/chat/${userId}`);
  };

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20 relative overflow-hidden">
      <HaloBlur />
      <Header title="Messages" />

      {/* Search Bar */}
      <div className="relative z-10 px-4 pb-4">
        <div className="text-xs text-gray-400 mb-2">
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une conversation..."
            className="pl-10 bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-white placeholder:text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="relative z-10 px-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingScreen />
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.user.id)}
                className="bg-[hsl(214,35%,22%)] rounded-lg p-4 hover:bg-[hsl(214,35%,25%)] cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      {conversation.user.avatar ? (
                        <img 
                          src={conversation.user.avatar} 
                          alt={conversation.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {conversation.user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold truncate ${!conversation.lastMessage.isRead ? 'text-white' : 'text-gray-300'}`}>
                          {conversation.user.name}
                        </h3>
                        {blockedUsers.has(conversation.user.id) && (
                          <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <span className={`text-xs ${!conversation.lastMessage.isRead ? 'text-[hsl(9,85%,67%)]' : 'text-gray-400'}`}>
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${!conversation.lastMessage.isRead ? 'text-gray-300' : 'text-gray-400'}`}>
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">@{conversation.user.username}</p>
                  </div>

                  {/* More Options */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/profile/${conversation.user.id}`);
                          }}
                          className="hover:bg-gray-700 text-white"
                        >
                          <Eye className="w-4 h-4 mr-2 text-blue-400" />
                          <span className="text-white">Voir le profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            const action = blockedUsers.has(conversation.user.id) ? 'unblock' : 'block';
                            blockUserMutation.mutate({ userId: conversation.user.id, action });
                          }}
                          className="hover:bg-gray-700 text-white"
                        >
                          {blockedUsers.has(conversation.user.id) ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-2 text-green-400" />
                              <span className="text-white">Débloquer</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-2 text-red-400" />
                              <span className="text-white">Bloquer</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold mb-2">Aucune conversation trouvée</h3>
              {searchQuery ? (
                <p className="text-sm">Essayez de modifier votre recherche</p>
              ) : (
                <p className="text-sm">Commencez une conversation depuis la page sociale</p>
              )}
            </div>
          </div>
        )}
      </div>

      
      <Navigation />
    </div>
  );
}