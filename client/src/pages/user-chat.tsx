import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Send, Plus, Camera, Image, Mic, Smile, ThumbsUp, ChevronLeft, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HaloBlur from "@/components/halo-blur";

interface Message {
  id: number;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'emoji';
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
}

export default function UserChat() {
  const { userId } = useParams();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Le trade,recherche,",
      timestamp: "13:17",
      isOwn: false,
      type: 'text'
    },
    {
      id: 2,
      content: "J'ai hâte que ton projet soit terminé, nous aurons enfin une base de partage et de recherche,liens etc",
      timestamp: "13:17",
      isOwn: false,
      type: 'text'
    },
    {
      id: 3,
      content: "Quand tu dis recherche c'est quoi ?",
      timestamp: "13:17",
      isOwn: true,
      type: 'text'
    },
    {
      id: 4,
      content: "La partie réseau et commu donc pour toi",
      timestamp: "13:17",
      isOwn: true,
      type: 'text'
    },
    {
      id: 5,
      content: "Ok. J'ai encore du taff 😀",
      timestamp: "13:17",
      isOwn: true,
      type: 'text'
    },
    {
      id: 6,
      content: "Recherche de cartes ,possibilité de faire la recherche simultanément sur l'appli et sur les sites partenaires ,comme un moteur de recherche",
      timestamp: "10:08",
      isOwn: false,
      type: 'text'
    },
    {
      id: 7,
      content: "La recherche sur les autres sites ça sera V2. Déjà sur la base de la plate-forme 😊",
      timestamp: "10:08",
      isOwn: true,
      type: 'text'
    },
    {
      id: 8,
      content: "👌",
      timestamp: "10:08",
      isOwn: false,
      type: 'emoji'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock user data - in real app this would come from API
  const user: User = {
    id: parseInt(userId || "1"),
    name: "Cyril Chalendar",
    username: "cyril_chalendar",
    avatar: undefined,
    isOnline: true
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        content: message,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        type: 'text'
      };
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  const handleSendThumbsUp = () => {
    const newMessage: Message = {
      id: messages.length + 1,
      content: "👍",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      type: 'emoji'
    };
    setMessages([...messages, newMessage]);
  };

  const formatMessageContent = (content: string) => {
    // Simple emoji detection - in real app you'd use a proper emoji library
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    return content.match(emojiRegex) && content.length <= 5;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <HaloBlur />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-gray-900/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setLocation('/chat')}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-blue-400" />
          </button>
          
          <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white font-bold">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          
          <div>
            <h2 className="font-semibold text-white">{user.name}</h2>
            <p className="text-sm text-gray-400">
              {user.isOnline ? "En ligne" : "Hors ligne"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-blue-400" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-start space-x-2 max-w-[80%]">
              {!msg.isOwn && (
                <div className="w-8 h-8 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              )}
              
              <div className={`relative px-4 py-2 rounded-2xl ${
                msg.isOwn 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white'
              } ${formatMessageContent(msg.content) ? 'text-2xl p-2' : ''}`}>
                <p className="break-words">{msg.content}</p>
              </div>
              
              {msg.isOwn && (
                <div className="w-8 h-8 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  M
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Timestamp */}
        <div className="text-center">
          <span className="text-xs text-gray-500">10:08</span>
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-4 bg-gray-900/90 backdrop-blur border-t border-gray-800">
        <div className="flex items-end space-x-2">
          <div className="flex items-center space-x-2 mr-2">
            <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <Plus className="w-5 h-5 text-blue-400" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <Camera className="w-5 h-5 text-blue-400" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <Image className="w-5 h-5 text-blue-400" />
            </button>
          </div>
          
          <div className="flex-1 flex items-end space-x-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Aa"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 rounded-2xl pr-20 resize-none min-h-[40px] max-h-[120px]"
                style={{ paddingRight: '80px' }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                  <Mic className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                  <Smile className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
            
            {message.trim() ? (
              <button
                onClick={handleSendMessage}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                onClick={handleSendThumbsUp}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ThumbsUp className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}