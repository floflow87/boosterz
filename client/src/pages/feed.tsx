import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HaloBlur from "@/components/HaloBlur";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: number;
  userId: number;
  content: string;
  type: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
  };
}

export default function Feed() {
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});

  // Get posts from followed users
  const { data: feedPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/users/feed"],
  });

  // Format timestamp helper
  const formatPostDate = (date: string | Date) => {
    const postDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? "À l'instant" : `Il y a ${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      return postDate.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Handle like functionality
  const handleLike = (postId: number) => {
    const isCurrentlyLiked = likedPosts.has(postId);
    const newLikedPosts = new Set(likedPosts);
    const currentLikes = postLikes[postId] || Math.floor(Math.random() * 50) + 5;
    
    if (isCurrentlyLiked) {
      newLikedPosts.delete(postId);
      setPostLikes(prev => ({ ...prev, [postId]: currentLikes - 1 }));
    } else {
      newLikedPosts.add(postId);
      setPostLikes(prev => ({ ...prev, [postId]: currentLikes + 1 }));
    }
    
    setLikedPosts(newLikedPosts);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
        <HaloBlur />
        <Header title="À la une" />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Chargement...</div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      <HaloBlur />
      <Header title="À la une" />
      
      <main className="relative z-10 px-4 pb-24">
        {feedPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">Aucun post dans ton fil d'actualité</div>
            <div className="text-sm text-gray-500">
              Commence à suivre d'autres collectionneurs pour voir leurs posts ici !
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {feedPosts.map((post) => (
              <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg overflow-hidden">
                {/* Post Header */}
                <div className="p-4 border-b border-[hsl(214,35%,30%)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{post.user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium text-sm">{post.user.name}</h4>
                          <span className="text-xs text-gray-400">@{post.user.username}</span>
                        </div>
                        <div className="text-xs text-gray-400">{formatPostDate(post.createdAt)}</div>
                      </div>
                    </div>
                    
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4">
                  <div className="text-white text-sm mb-3 leading-relaxed">
                    {post.content}
                  </div>
                </div>

                {/* Post Actions */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between pt-3 border-t border-[hsl(214,35%,30%)]">
                    <div className="flex items-center space-x-6">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          likedPosts.has(post.id) 
                            ? 'text-red-500' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        <span className="text-sm">{postLikes[post.id] || Math.floor(Math.random() * 50) + 5}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{Math.floor(Math.random() * 20) + 2}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm">Partager</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}