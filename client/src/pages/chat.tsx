import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Send, ArrowLeft, MoreVertical, Camera, Image, UserCheck, UserX, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LoadingScreen from "@/components/LoadingScreen";
import ImagePreview from "@/components/ImagePreview";
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

  // Load blocked status from localStorage
  useEffect(() => {
    const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
    setIsBlocked(blockedUsers.includes(userId));
  }, [userId]);

  // Get current user ID from authentication  
  const { data: authData } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  const currentUserId = authData?.user?.id;

  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery<Conversation>({
    queryKey: [`/api/chat/conversations/user/${userId}`],
    enabled: !!userId,
  });

  // Get messages for this conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/chat/conversations/${conversation?.id}/messages`],
    enabled: !!conversation?.id,
    refetchInterval: 2000, // Auto-refresh every 2 seconds
  });

  // Mark messages as read when entering conversation
  useEffect(() => {
    if (conversation?.id && messages?.length) {
      markAsReadMutation.mutate(conversation.id);
    }
  }, [conversation?.id, messages?.length]);

  // Get other user info with fallback for non-existent users
  const { data: otherUser, isLoading: userLoading, isError: userError } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Create fallback user data when user doesn't exist
  const fallbackUser = userError ? {
    id: userId,
    name: userId === 2 ? "Max la menace" : `Utilisateur ${userId}`,
    username: userId === 2 ? "maxlamenace" : `user${userId}`
  } : null;

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      // Send to server with recipient ID
      return apiRequest("POST", `/api/messages/send`, {
        content: messageContent,
        recipientId: Number(userId),
      });
    },
    onSuccess: (data) => {
      setNewMessage("");
      // Immediately update the messages cache with the new message
      queryClient.setQueryData(
        [`/api/chat/conversations/${conversation?.id}/messages`],
        (oldMessages: any[]) => [...(oldMessages || []), data]
      );
      // Refresh conversations list to update notifications
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
    onError: (error: any) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${userId}/messages`] });
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest("POST", `/api/chat/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const photoMessage = `[IMAGE:${imageData}]${file.name}`;
        sendMessageMutation.mutate(photoMessage);
      };
      reader.readAsDataURL(file);
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
    const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
    const newBlockedState = !isBlocked;
    
    let updatedBlockedUsers;
    if (newBlockedState) {
      updatedBlockedUsers = [...blockedUsers, userId];
    } else {
      updatedBlockedUsers = blockedUsers.filter((id: number) => id !== userId);
    }
    
    localStorage.setItem('blockedUsers', JSON.stringify(updatedBlockedUsers));
    setIsBlocked(newBlockedState);
    
    toast({
      title: newBlockedState ? "Utilisateur bloqué" : "Utilisateur débloqué",
      description: newBlockedState 
        ? `${displayUser?.name} ne peut plus vous envoyer de messages.`
        : `${displayUser?.name} peut maintenant vous envoyer des messages.`,
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
    if (conversation?.id && messages && messages.length > 0) {
      const hasUnreadMessages = messages.some(msg => msg.senderId !== currentUserId && !msg.isRead);
      if (hasUnreadMessages) {
        markAsReadMutation.mutate(conversation.id);
      }
    }
  }, [conversation?.id, messages, currentUserId]);

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
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setLocation("/conversations")}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700">
            <DropdownMenuItem onClick={handleViewProfile} className="text-white hover:bg-gray-700 cursor-pointer">
              <Eye className="w-4 h-4 mr-2" />
              Voir le profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBlockUser} className="text-white hover:bg-gray-700 cursor-pointer">
              {isBlocked ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Débloquer
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Bloquer
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto pt-4 pb-24 px-4" style={{ paddingTop: '80px' }}>
        <div className="space-y-4 min-h-full">
          {messages && messages.length > 0 ? (
            messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} ${index === 0 ? "mt-6" : ""}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {!isOwn && (
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        {(displayUser as any)?.avatar ? (
                          <img 
                            src={(displayUser as any).avatar} 
                            alt={displayUser.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {displayUser.name?.charAt(0) || displayUser.username?.charAt(0)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? "bg-[hsl(9,85%,67%)] text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {message.content.startsWith('[IMAGE:') ? (
                        <div>
                          <ImagePreview
                            src={message.content.match(/\[IMAGE:(.*?)\]/)?.[1] || ''}
                            alt="Image partagée"
                            className="max-w-full h-auto rounded-lg mb-2"
                          />
                          <p className="text-xs text-gray-300">
                            {message.content.replace(/\[IMAGE:.*?\]/, '')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                        {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
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
      </div>

      {/* Fixed Message Input */}
      <div className={`fixed bottom-0 left-0 right-0 z-10 p-4 border-t border-gray-800 bg-gray-900 ${isBlocked ? 'opacity-50 pointer-events-none' : ''}`}>
        {isBlocked && (
          <div className="text-center text-red-400 text-sm mb-2">
            Vous avez bloqué cet utilisateur. Débloquez-le pour envoyer des messages.
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <DropdownMenu open={showPhotoOptions} onOpenChange={setShowPhotoOptions}>
            <DropdownMenuTrigger asChild>
              <Button 
                type="button"
                variant="outline"
                size="icon"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                disabled={isBlocked}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem onClick={handleCameraCapture} className="text-white hover:bg-gray-700 cursor-pointer">
                <Camera className="w-4 h-4 mr-2" />
                Prendre une photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGallerySelect} className="text-white hover:bg-gray-700 cursor-pointer">
                <Image className="w-4 h-4 mr-2" />
                Choisir depuis la galerie
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isBlocked ? "Utilisateur bloqué" : "Tapez votre message..."}
            className="flex-1 bg-gray-800 border-gray-700 text-white"
            disabled={sendMessageMutation.isPending || isBlocked}
          />
          
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending || isBlocked}
            className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}