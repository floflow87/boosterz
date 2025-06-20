import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Send, ArrowLeft, MoreVertical, Camera, Image, UserCheck, UserX, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LoadingScreen from "@/components/LoadingScreen";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, Conversation, User } from "@shared/schema";

export default function Chat() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const userId = parseInt(params.userId || "0");
  const currentUserId = 1; // Current logged-in user

  // Get or create conversation
  const { data: conversations, isLoading: conversationLoading } = useQuery<Conversation[]>({
    queryKey: [`/api/chat/conversations/user/${userId}`],
    enabled: !!userId,
  });

  const conversation = conversations?.[0];

  // Get messages for this conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/chat/conversations/${conversation?.id}/messages`],
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Get other user info with fallback for non-existent users
  const { data: otherUser, isLoading: userLoading, isError: userError } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Create fallback user data when user doesn't exist
  const fallbackUser = userError ? {
    id: userId,
    name: userId === 999 ? "Max la menace" : `Utilisateur ${userId}`,
    username: userId === 999 ? "maxlamenace" : `user${userId}`
  } : null;

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      // Use the userId as conversation ID since our backend is set up this way
      const conversationId = conversation?.id || userId;
      return apiRequest("POST", `/api/chat/conversations/${conversationId}/messages`, {
        content: messageContent,
        senderId: currentUserId,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${conversation?.id}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/user/${userId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isBlocked) return;
    
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !isBlocked) {
      const photoMessage = `📷 Photo partagée: ${file.name}`;
      sendMessageMutation.mutate(photoMessage);
    }
    event.target.value = '';
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleBlockUser = () => {
    setIsBlocked(!isBlocked);
    toast({
      title: isBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué",
      description: isBlocked 
        ? `${displayUser.name} peut maintenant vous envoyer des messages.`
        : `${displayUser.name} ne peut plus vous envoyer de messages.`,
      className: "bg-green-600 text-white border-green-700"
    });
  };

  const handleViewProfile = () => {
    setLocation(`/profile/${userId}`);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (conversation?.id) {
      apiRequest("PUT", `/api/chat/conversations/${conversation.id}/read`, {});
    }
  }, [conversation?.id]);

  const isLoading = conversationLoading || messagesLoading || (userLoading && !userError);
  const displayUser = fallbackUser || otherUser;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Utilisateur introuvable</h2>
          <Button onClick={() => setLocation("/social")} variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setLocation("/social")}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {(displayUser as any)?.avatar ? (
              <img 
                src={(displayUser as any).avatar} 
                alt={displayUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {displayUser.name?.charAt(0) || displayUser.username?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{displayUser.name || displayUser.username}</h2>
            <p className="text-xs text-gray-400">@{displayUser.username}</p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-[hsl(9,85%,67%)] text-white"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                    {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">Aucun message</p>
              <p className="text-sm">Commencez la conversation avec {displayUser.name || displayUser.username}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}