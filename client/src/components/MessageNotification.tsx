import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocation } from "wouter";

interface MessageNotificationProps {
  show: boolean;
  message: {
    senderName: string;
    content: string;
    conversationId: number;
  };
  onClose: () => void;
}

export default function MessageNotification({ show, message, onClose }: MessageNotificationProps) {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClick = () => {
    setLocation(`/chat/${message.conversationId}`);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!show) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div 
        onClick={handleClick}
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 max-w-sm cursor-pointer hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white truncate">
                {message.senderName}
              </h4>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-300 mt-1 line-clamp-2">
              {message.content}
            </p>
            <div className="text-xs text-gray-400 mt-2 flex items-center">
              <div className="w-2 h-2 bg-[hsl(9,85%,67%)] rounded-full mr-2 animate-pulse"></div>
              Nouveau message
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}