import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Send, ArrowLeft, Search, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";

interface User {
  id: number;
  username: string;
  name: string;
  avatar?: string;
}

interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt: string;
  otherUser: User;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get auth token
  const token = localStorage.getItem("authToken");
  if (!token) {
    setLocation("/auth");
    return null;
  }

  // Get conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/chat/conversations"],
    queryFn: () => apiRequest("GET", "/api/chat/conversations", undefined, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  });

  // Get messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/messages`],
    queryFn: () => apiRequest("GET", `/api/chat/conversations/${selectedConversation}/messages`, undefined, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    enabled: !!selectedConversation,
  });

  // Get all users for search
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search"],
    queryFn: () => apiRequest("GET", "/api/users/search", undefined, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      return apiRequest("POST", `/api/chat/conversations/${conversationId}/messages`, { content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      return apiRequest("POST", "/api/chat/conversations", { otherUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setSelectedConversation(conversation.id);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const startConversation = (userId: number) => {
    createConversationMutation.mutate(userId);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="flex h-screen">
        {/* Conversations sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Messages</h2>
              <button
                onClick={() => setLocation("/")}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search users */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Search results */}
          {searchQuery && (
            <div className="border-b border-gray-800 max-h-48 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    startConversation(user.id);
                    setSearchQuery("");
                  }}
                  className="w-full p-3 hover:bg-gray-800 flex items-center space-x-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune conversation</p>
                <p className="text-sm">Recherchez un utilisateur pour commencer</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 hover:bg-gray-800 flex items-center space-x-3 transition-colors ${
                    selectedConversation === conversation.id ? "bg-gray-800" : ""
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    {conversation.otherUser.avatar ? (
                      <img 
                        src={conversation.otherUser.avatar} 
                        alt={conversation.otherUser.name} 
                        className="w-12 h-12 rounded-full object-cover" 
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{conversation.otherUser.name}</p>
                    <p className="text-sm text-gray-400">@{conversation.otherUser.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-800 bg-gray-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {conversations.find(c => c.id === selectedConversation)?.otherUser.name}
                    </p>
                    <p className="text-sm text-gray-400">En ligne</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender.id === 1 ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender.id === 1
                          ? "bg-[#F37261] text-white"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <Input
                    type="text"
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    style={{ backgroundColor: '#F37261' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">Sélectionnez une conversation</p>
                <p>Choisissez une conversation pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}