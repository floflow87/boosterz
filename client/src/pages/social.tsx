import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, TrendingUp, Store, Users, MessageCircle, Heart, MoreVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, Post } from "@shared/schema";

interface CurrentUser {
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

interface SocialUser {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  totalCards: number;
  collectionsCount: number;
  completionPercentage: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

export default function Social() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("featured");
  const [searchTerm, setSearchTerm] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
  const [postCommentsCount, setPostCommentsCount] = useState<Record<number, number>>({});
  const { toast } = useToast();

  // Get current user
  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const currentUserId = currentUser?.user?.id?.toString() || "1";

  // Feed query (posts from followed users)
  const { data: feed = [], isLoading: feedLoading } = useQuery<Post[]>({
    queryKey: ["/api/users/feed"],
  });

  // My posts query
  const { data: myPosts = [], isLoading: myPostsLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${currentUserId}/posts`],
  });

  // Users for discovery
  const { data: users = [], isLoading: usersLoading } = useQuery<SocialUser[]>({
    queryKey: ["/api/social/users", { limit: 10 }],
  });

  // Search results
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SocialUser[]>({
    queryKey: ["/api/social/users", { search: searchTerm, limit: 50 }],
    enabled: searchTerm.length > 1,
    staleTime: 5000,
  });

  // User likes
  const { data: userLikes = [] } = useQuery<number[]>({
    queryKey: ['/api/posts/likes'],
    enabled: !!currentUser?.user?.id,
  });

  // Update liked posts when data arrives
  useEffect(() => {
    if (userLikes.length > 0) {
      setLikedPosts(new Set(userLikes));
    }
  }, [userLikes]);

  // Initialize post likes and comments
  useEffect(() => {
    const allPosts = [...feed, ...myPosts];
    if (allPosts.length > 0) {
      const likes: Record<number, number> = {};
      const comments: Record<number, number> = {};
      allPosts.forEach(post => {
        const currentLikeCount = postLikes[post.id];
        const serverLikeCount = post.likesCount || 0;
        likes[post.id] = currentLikeCount !== undefined ? currentLikeCount : serverLikeCount;
        
        const currentCommentCount = postCommentsCount[post.id];
        const serverCommentCount = post.commentsCount || 0;
        comments[post.id] = currentCommentCount !== undefined ? currentCommentCount : serverCommentCount;
      });
      setPostLikes(prev => ({ ...prev, ...likes }));
      setPostCommentsCount(prev => ({ ...prev, ...comments }));
    }
  }, [feed.length, myPosts.length]);

  // Handle like functionality
  const handleLike = async (postId: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.liked) {
        setLikedPosts(prev => new Set([...prev, postId]));
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
      
      setPostLikes(prev => ({ ...prev, [postId]: result.likesCount }));
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; type: string; imageUrl?: string }) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/posts`] });
      
      setNewPostContent("");
      setSelectedPhoto(null);
      setIsPostModalOpen(false);
      
      toast({
        title: "Publication créée avec succès",
        className: "bg-green-600 text-white border-green-700"
      });
    },
    onError: () => {
      toast({
        title: "Erreur lors de la création",
        variant: "destructive",
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/posts`] });
      toast({
        title: "Post supprimé",
        description: "Le post a été supprimé avec succès",
        className: "bg-green-600 border-green-600 text-white",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le post",
        variant: "destructive",
      });
    },
  });

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (newPostContent.trim()) {
      let imageUrl: string | undefined = undefined;
      
      if (selectedPhoto) {
        try {
          imageUrl = await convertToBase64(selectedPhoto);
        } catch (error) {
          console.error('Erreur lors de la conversion de l\'image:', error);
          toast({
            title: "Erreur",
            description: "Impossible de traiter l'image",
            variant: "destructive",
          });
          return;
        }
      }
      
      const postData = {
        content: newPostContent,
        type: selectedPhoto ? "image" : "text",
        ...(imageUrl && { imageUrl })
      };
      
      createPostMutation.mutate(postData);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  // Format date
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

  // Handle add comment
  const handleAddComment = async (postId: number) => {
    const commentContent = commentInputs[postId];
    if (!commentContent?.trim()) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentContent.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du commentaire');
      }

      const result = await response.json();
      
      setPostComments(prev => ({
        ...prev,
        [postId]: [{
          id: result.comment.id,
          content: result.comment.content,
          createdAt: result.comment.createdAt,
          user: {
            id: result.comment.user.id,
            name: result.comment.user.name,
            username: result.comment.user.username,
            avatar: result.comment.user.avatar
          }
        }, ...(prev[postId] || [])]
      }));

      setPostCommentsCount(prev => ({
        ...prev,
        [postId]: result.commentsCount
      }));

      setCommentInputs(prev => ({
        ...prev,
        [postId]: ""
      }));
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  // Render feed content
  const renderFeedContent = () => {
    if (feedLoading) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400">Chargement du feed...</div>
        </div>
      );
    }

    if (feed.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-24 h-24 bg-yellow-600/20 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold mb-4 text-white">Tu ne suis personne</h3>
          <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
            Pour suivre l'actualité de tes concurrents favoris, c'est par ici
          </p>
          <button
            onClick={() => setActiveTab("discover")}
            className="px-6 py-3 bg-[#F37261] hover:bg-[#e5624f] text-white font-medium rounded-lg transition-colors"
          >
            Découvrir
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {feed.map((post) => (
          <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)] overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {post.user?.avatar ? (
                      <img 
                        src={post.user.avatar} 
                        alt={`Avatar de ${post.user.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{post.user?.name?.charAt(0) || 'U'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setLocation(`/profile/${post.user?.id || 0}`)}
                        className="text-white font-medium text-sm hover:text-[hsl(9,85%,67%)] transition-colors"
                      >
                        {post.user?.name}
                      </button>
                      <span className="text-xs text-gray-400">@{post.user?.username}</span>
                    </div>
                    <div className="text-xs text-gray-400">{formatPostDate(post.createdAt)}</div>
                  </div>
                </div>
              </div>
              
              {/* Post Content */}
              {post.content && (
                <div className="text-white text-sm mb-3 leading-relaxed mt-3">
                  {post.content}
                </div>
              )}
              
              {/* Post Image */}
              {post.imageUrl && (
                <div className="mt-3 mb-3">
                  <img 
                    src={post.imageUrl} 
                    alt="Image du post"
                    className="w-full max-h-96 object-cover rounded-lg border border-[hsl(214,35%,30%)]"
                  />
                </div>
              )}
              
              {/* Post Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <span>{postLikes[post.id] || 0}</span>
                    <span>J'aime</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <span>{postCommentsCount[post.id] || 0}</span>
                    <span>Commentaire{(postCommentsCount[post.id] || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[hsl(214,35%,30%)] mt-3 pt-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    <span>J'aime</span>
                  </button>
                  <button 
                    onClick={() => {
                      const newShowComments = new Set(showComments);
                      if (newShowComments.has(post.id)) {
                        newShowComments.delete(post.id);
                      } else {
                        newShowComments.add(post.id);
                      }
                      setShowComments(newShowComments);
                    }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Commenter</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments.has(post.id) && (
                <div className="mt-4 pt-4 border-t border-[hsl(214,35%,30%)]">
                  <div className="flex space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {currentUser?.user?.avatar ? (
                        <img 
                          src={currentUser.user.avatar} 
                          alt={`Avatar de ${currentUser.user.name || currentUser.user.username}`} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {currentUser?.user?.name?.charAt(0)?.toUpperCase() || currentUser?.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex space-x-2">
                      <Input
                        placeholder="Écrire un commentaire..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ 
                          ...prev, 
                          [post.id]: e.target.value 
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id);
                          }
                        }}
                        className="bg-[hsl(214,35%,18%)] border-[hsl(214,35%,30%)] text-white text-sm"
                      />
                      <Button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        size="sm"
                        className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
                      >
                        Publier
                      </Button>
                    </div>
                  </div>

                  {postComments[post.id] && postComments[post.id].length > 0 && (
                    <div className="space-y-3 mb-4">
                      {postComments[post.id].map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {comment.user?.avatar ? (
                              <img 
                                src={comment.user.avatar} 
                                alt={`Avatar de ${comment.user.name}`} 
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-[hsl(214,35%,18%)] rounded-lg px-3 py-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium text-sm">
                                  {comment.user?.name}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-200 text-sm">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] relative overflow-hidden">
      <HaloBlur />
      
      {/* Header with logo */}
      <div className="relative z-10 px-4 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white font-['Luckiest_Guy']">
            <span className="text-white">BOOSTER</span>
            <span className="text-[hsl(9,85%,67%)]">Z</span>
          </h1>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="relative z-10 px-4 mb-6">
        <div className="flex space-x-1 bg-[hsl(214,35%,22%)] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("featured")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
              activeTab === "featured" 
                ? "bg-[hsl(9,85%,67%)] text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">À la une</span>
          </button>
          <button
            onClick={() => setLocation('/marketplace')}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Sur le marché</span>
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
              activeTab === "discover" 
                ? "bg-[hsl(9,85%,67%)] text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Découvrir</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
              activeTab === "profile" 
                ? "bg-[hsl(9,85%,67%)] text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Mes posts</span>
          </button>
        </div>
      </div>

      {/* Search bar (visible on all tabs) */}
      <div className="relative z-10 px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={activeTab === "discover" ? "Rechercher des collectionneurs..." : "Rechercher..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
          />
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 px-4 pb-24">
        {activeTab === "featured" && renderFeedContent()}
        
        {activeTab === "discover" && (
          <div className="space-y-3">
            {(usersLoading || searchLoading) ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Chargement...</div>
              </div>
            ) : (searchTerm.length > 1 ? searchResults : users).length > 0 ? (
              (searchTerm.length > 1 ? searchResults : users).map((user) => (
                <div key={user.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <button 
                          onClick={() => setLocation(`/profile/${user.id}`)}
                          className="text-white font-medium hover:text-[hsl(9,85%,67%)] transition-colors"
                        >
                          {user.name || user.username}
                        </button>
                        <div className="text-gray-400 text-sm">@{user.username}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {/* Handle follow */}}
                      size="sm"
                      className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
                    >
                      Suivre
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-white font-bold">{user.totalCards}</div>
                      <div className="text-gray-400 text-xs">Cartes</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{user.followersCount || 0}</div>
                      <div className="text-gray-400 text-xs">Abonnés</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{user.completionPercentage || 0}%</div>
                      <div className="text-gray-400 text-xs">Complétée</div>
                    </div>
                  </div>
                </div>
              ))
            ) : searchTerm.length > 1 ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Aucun utilisateur trouvé pour "{searchTerm}"</div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">Aucun utilisateur à découvrir</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 mb-6 border border-[hsl(214,35%,30%)]">
              <div className="flex items-center space-x-4 mb-4">
                {currentUser?.user?.avatar ? (
                  <img 
                    src={currentUser.user.avatar} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {currentUser?.user?.name?.charAt(0) || currentUser?.user?.username?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {currentUser?.user?.name || currentUser?.user?.username || 'Chargement...'} @{currentUser?.user?.username || 'chargement...'}
                  </h3>
                  <p className="text-gray-400">Collection privée</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{myPosts.length}</div>
                  <div className="text-xs text-gray-400">Posts</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">0</div>
                  <div className="text-xs text-gray-400">Commentaires</div>
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="space-y-4">
              {/* Post Creation Trigger */}
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity w-full"
                onClick={() => setIsPostModalOpen(true)}
              >
                <div className="w-full bg-[hsl(214,35%,22%)] border border-[hsl(214,35%,30%)] rounded-lg px-3 py-3 text-gray-400 pointer-events-none">
                  Quoi de neuf ?
                </div>
              </div>

              {myPostsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Chargement des posts...</div>
                </div>
              ) : myPosts.length > 0 ? (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)]">
                      {/* Post Header */}
                      <div className="p-4 border-b border-[hsl(214,35%,30%)] bg-[hsl(214,35%,18%)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              {currentUser?.user?.avatar ? (
                                <img 
                                  src={currentUser.user.avatar} 
                                  alt={`Avatar de ${currentUser.user.name}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">{currentUser?.user?.name?.charAt(0) || currentUser?.user?.username?.charAt(0) || 'U'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setLocation(`/profile/${currentUser?.user?.id}`)}
                                  className="text-white font-medium text-sm hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                  {currentUser?.user?.name?.toUpperCase() || currentUser?.user?.username?.toUpperCase() || 'CHARGEMENT...'}
                                </button>
                                <button
                                  onClick={() => setLocation(`/profile/${currentUser?.user?.id}`)}
                                  className="text-xs text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                  @{currentUser?.user?.username || 'chargement...'}
                                </button>
                              </div>
                              <div className="text-xs text-gray-400">{formatPostDate(post.createdAt)}</div>
                            </div>
                          </div>
                          
                          {/* Delete button for own posts */}
                          <button
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deletePostMutation.isPending}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Post Content */}
                      <div className="p-4">
                        {post.content && (
                          <div className="text-white text-sm mb-3 leading-relaxed">
                            {post.content}
                          </div>
                        )}
                        
                        {post.imageUrl && (
                          <div className="mt-3 mb-3">
                            <img 
                              src={post.imageUrl} 
                              alt="Image du post"
                              className="w-full max-h-96 object-cover rounded-lg border border-[hsl(214,35%,30%)]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                              <span>{postLikes[post.id] || 0}</span>
                              <span>J'aime</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                              <span>{postCommentsCount[post.id] || 0}</span>
                              <span>Commentaire{(postCommentsCount[post.id] || 0) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-[hsl(214,35%,30%)] mt-3 pt-3">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center space-x-2 transition-colors ${
                                likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                              <span>J'aime</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors text-xs">
                              <MessageCircle className="w-4 h-4" />
                              <span>Commenter</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">Aucun post pour le moment</div>
                  <Button
                    onClick={() => setIsPostModalOpen(true)}
                    className="bg-[#F37261] hover:bg-[#e5624f] text-white font-medium"
                  >
                    Créer mon premier post
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Post Creation Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-[hsl(214,35%,11%)] z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ← Retour
              </button>
              <h1 className="text-lg font-semibold text-white">Nouvelle publication</h1>
              <div className="w-16"></div>
            </div>

            {/* Text area */}
            <div className="border border-[hsl(214,35%,30%)] rounded-lg p-4 mb-4">
              <Textarea
                placeholder="Quoi de neuf ?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="bg-transparent border-none text-white placeholder-gray-400 resize-none text-sm min-h-[150px] focus:outline-none w-full"
                autoFocus
              />
            </div>

            {/* Photo preview */}
            {selectedPhoto && (
              <div className="relative mb-4 border border-[hsl(214,35%,30%)] rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(selectedPhoto)}
                    alt="Photo sélectionnée"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {selectedPhoto.name}
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center space-x-6 mb-6">
              <label className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <span className="text-sm">Photo/Vidéo</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-between gap-3 fixed bottom-6 left-4 right-4">
              <Button
                onClick={() => {
                  setIsPostModalOpen(false);
                  setNewPostContent("");
                  setSelectedPhoto(null);
                }}
                variant="outline"
                className="flex-1 border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || createPostMutation.isPending}
                className="flex-1 bg-[#F37261] hover:bg-[#e5624f] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium"
              >
                {createPostMutation.isPending ? "Publication..." : "Publier"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
}