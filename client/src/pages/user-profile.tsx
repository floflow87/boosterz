import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  Star,
  TrendingUp,
  Grid3X3,
  List,
  Search,
  Heart,
  MessageCircle,
  Trash2,
  MoreHorizontal,
  Send
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import CardDisplay from "@/components/card-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { PostComponent } from "@/components/PostComponent";
import type { User, Collection, Card, Post } from "@shared/schema";

// Utilitaires pour les thèmes de deck (réplique de collections.tsx)
const getThemeGradient = (themeColors: string) => {
  const themes: Record<string, string> = {
    "Marine & Or": "linear-gradient(135deg, #1e3a8a 0%, #fbbf24 100%)",
    "Noir & Argent": "linear-gradient(135deg, #1f1f1f 0%, #e5e7eb 100%)",
    "Rouge & Blanc": "linear-gradient(135deg, #dc2626 0%, #f9fafb 100%)",
    "Vert & Blanc": "linear-gradient(135deg, #16a34a 0%, #f9fafb 100%)",
    "Marine & Bronze": "linear-gradient(135deg, #1e3a8a 0%, #a16207 100%)",
    "Or & Noir": "linear-gradient(135deg, #fbbf24 0%, #1f1f1f 100%)",
    "Rouge & Noir": "linear-gradient(135deg, #dc2626 0%, #1f1f1f 100%)",
    "Bleu Blanc Rouge": "linear-gradient(135deg, #2563eb 0%, #f9fafb 50%, #dc2626 100%)"
  };
  return themes[themeColors] || "hsl(214,35%,22%)";
};

const getThemeTextColor = (themeColors: string) => {
  const themes: Record<string, string> = {
    "Marine & Or": "#fbbf24",
    "Noir & Argent": "#e5e7eb", 
    "Rouge & Blanc": "#f9fafb",
    "Vert & Blanc": "#f9fafb",
    "Marine & Bronze": "#a16207",
    "Or & Noir": "#fbbf24",
    "Rouge & Noir": "#dc2626",
    "Bleu Blanc Rouge": "#f9fafb"
  };
  return themes[themeColors] || "#ffffff";
};

interface CommentData {
  id: number;
  postId: number;
  userId: number;
  content: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function UserProfile() {
  const [match, params] = useRoute("/user/:userId");
  const userId = params?.userId;
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [saleFilter, setSaleFilter] = useState<"all" | "available" | "sold">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Like system state
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});
  
  // Comments state
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postComments, setPostComments] = useState<Record<number, CommentData[]>>({});

  // Get current user for interactions
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  const currentUserData = authData?.user;

  // Handle like/unlike post
  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (result.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        setPostLikes(prev => ({ ...prev, [postId]: result.likesCount }));
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId: number) => {
    const newShowComments = new Set(showComments);
    if (newShowComments.has(postId)) {
      newShowComments.delete(postId);
    } else {
      newShowComments.add(postId);
    }
    setShowComments(newShowComments);
  };

  // Add comment to post
  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mettre à jour les commentaires (ajout en tête pour ordre décroissant)
        setPostComments(prev => ({
          ...prev,
          [postId]: [{
            id: result.comment.id,
            content: result.comment.content,
            author: result.comment.user.name,
            avatar: result.comment.user.avatar,
            timestamp: new Date(result.comment.createdAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }, ...(prev[postId] || [])]
        }));

        setPostCommentsCount(prev => ({
          ...prev,
          [postId]: result.commentsCount
        }));

        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  // Initialize post likes from posts data and liked posts
  useEffect(() => {
    if (posts) {
      const initialLikes: Record<number, number> = {};
      posts.forEach(post => {
        initialLikes[post.id] = post.likesCount || 0;
      });
      setPostLikes(initialLikes);
    }
  }, [posts]);

  // Initialize liked posts
  useEffect(() => {
    if (likedPostIds) {
      setLikedPosts(new Set(likedPostIds));
    }
  }, [likedPostIds]);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });



  const { data: collections = [], isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: [`/api/users/${userId}/collections`],
  });

  const { data: marketplaceCards = [] } = useQuery<Card[]>({
    queryKey: [`/api/users/${userId}/marketplace`],
  });

  const { data: featuredCards = [] } = useQuery<Card[]>({
    queryKey: [`/api/users/${userId}/featured`],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${userId}/posts`],
  });

  // Get liked posts
  const { data: likedPostIds = [] } = useQuery({
    queryKey: ['/api/posts/likes'],
    queryFn: async () => {
      const response = await fetch('/api/posts/likes');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentUserData
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/posts/${postId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
      toast({
        title: "Post supprimé",
        description: "Le post a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      console.error('Delete post error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le post",
        variant: "destructive",
      });
    },
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

  // Filter cards based on search and sale status
  const filteredMarketplaceCards = marketplaceCards.filter(card => {
    const matchesSearch = card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.cardType.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (saleFilter === 'available') return matchesSearch && card.isForTrade && !card.isSold;
    if (saleFilter === 'sold') return matchesSearch && card.isSold;
    return matchesSearch && card.isForTrade;
  });

  if (userLoading || collectionsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
        <HaloBlur />
        <Header title="Profil" />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Chargement...</div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
        <HaloBlur />
        <Header title="Profil" />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Utilisateur introuvable</div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden">
      <HaloBlur />
      
      <Header title={`@${user.username}`} />

      <main className="relative z-10 pb-24">
        {/* Header Profile - Reproduit l'image exacte */}
        <div className="bg-[hsl(214,35%,22%)] px-6 pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar principal avec fond arrondi */}
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">{user.name.charAt(0)}</span>
              )}
            </div>
            
            {/* Nom complet en majuscules */}
            <h1 className="text-xl font-bold text-white tracking-wide">{user.name.toUpperCase()}</h1>
            
            {/* Pseudo grisé */}
            <p className="text-gray-400 text-sm">@{user.username}</p>
            
            {/* Description */}
            {user.bio ? (
              <p className="text-gray-300 text-xs max-w-xs leading-relaxed">
                {user.bio}
              </p>
            ) : (
              <p className="text-gray-500 text-xs italic">
                Description lorem ipsum
              </p>
            )}
            
            {/* KPIs intégrés dans le header */}
            <div className="grid grid-cols-3 gap-8 pt-4 w-full max-w-xs">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.totalCards || 0}</div>
                <div className="text-xs text-gray-400">Cartes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{userDecks.length}</div>
                <div className="text-xs text-gray-400">Decks</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.followersCount || 0}</div>
                <div className="text-xs text-gray-400">Abonnés</div>
              </div>
            </div>
          </div>
          
          {/* Onglets intégrés dans le header */}
          <div className="pt-6">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0 space-x-0">
                <TabsTrigger 
                  value="posts" 
                  className="text-sm text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(9,85%,67%)] rounded-none border-b-2 border-transparent pb-3 bg-transparent"
                >
                  À la une
                </TabsTrigger>
                <TabsTrigger 
                  value="marketplace" 
                  className="text-sm text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(9,85%,67%)] rounded-none border-b-2 border-transparent pb-3 bg-transparent"
                >
                  En vente
                </TabsTrigger>
                <TabsTrigger 
                  value="decks" 
                  className="text-sm text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(9,85%,67%)] rounded-none border-b-2 border-transparent pb-3 bg-transparent"
                >
                  Decks
                </TabsTrigger>
              </TabsList>
              
              <div className="px-4 pt-6">

          {/* À la une Tab Content */}
          <TabsContent value="posts" className="space-y-4">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Chargement des posts...</div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)]">
                    {/* Post Header - Style similaire au feed social */}
                    <div className="p-4 border-b border-[hsl(214,35%,30%)] bg-[hsl(214,35%,18%)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setLocation(`/user/${user.id}`)}
                                className="text-white font-medium text-sm hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                {user.name}
                              </button>
                              <button
                                onClick={() => setLocation(`/user/${user.id}`)}
                                className="text-xs text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                @{user.username}
                              </button>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatPostDate(post.createdAt)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu options pour le post si c'est l'utilisateur actuel */}
                        {currentUserData?.id === user.id && (
                          <button
                            onClick={() => deletePostMutation.mutate(post.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <p className="text-white text-sm mb-3 leading-relaxed">{post.content}</p>
                      
                      {post.imageUrl && (
                        <div className="mb-3">
                          <img 
                            src={post.imageUrl} 
                            alt="Post image" 
                            className="w-full max-w-md rounded-lg"
                          />
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm mt-3">
                        <span className={likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400'}>
                          {postLikes[post.id] || post.likesCount || 0} j'aime
                        </span>
                        <span className="text-gray-400 cursor-pointer hover:text-blue-400 transition-colors" 
                              onClick={() => toggleComments(post.id)}>
                          {postComments[post.id]?.length || 0} commentaire{(postComments[post.id]?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Interaction Buttons */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(214,35%,30%)]">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 transition-colors ${
                            likedPosts.has(post.id) 
                              ? 'text-red-500' 
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-sm">J'aime</span>
                        </button>
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">Commenter</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments.has(post.id) && (
                        <div className="mt-4 space-y-3">
                          {/* Add comment */}
                          <div className="flex space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              {currentUserData?.avatar ? (
                                <img 
                                  src={currentUserData.avatar} 
                                  alt="Mon avatar"
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span className="text-xs font-bold text-white">
                                  {currentUserData?.name?.charAt(0) || 'U'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 flex space-x-2">
                              <Input
                                placeholder="Ajouter un commentaire..."
                                value={commentInputs[post.id] || ""}
                                onChange={(e) => setCommentInputs(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value
                                }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                                className="bg-[hsl(214,35%,18%)] border-[hsl(214,35%,30%)] text-white placeholder:text-gray-400 text-sm"
                              />
                              <Button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                size="sm"
                                className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Comments list */}
                          {postComments[post.id] && postComments[post.id].length > 0 && (
                            <div className="space-y-2">
                              {postComments[post.id].map((comment) => (
                                <div key={comment.id} className="flex space-x-3 p-3 bg-[hsl(214,35%,18%)] rounded-lg">
                                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                                    {comment.userAvatar ? (
                                      <img 
                                        src={comment.userAvatar} 
                                        alt="Avatar"
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold text-white">
                                        {comment.userName?.charAt(0) || 'U'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-white">{comment.userName}</span>
                                      <span className="text-xs text-gray-400">{comment.createdAt}</span>
                                    </div>
                                    <p className="text-sm text-gray-300">{comment.content}</p>
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
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">Aucun post pour le moment</div>
                <p className="text-sm text-gray-500">
                  Les publications apparaîtront ici
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decks" className="space-y-4">
            {deckPreviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {deckPreviews.map((deck: any) => (
                  <div 
                    key={deck.id} 
                    onClick={() => setLocation(`/deck/${deck.id}`)}
                    className="rounded-2xl p-4 border-2 border-yellow-500/50 hover:border-yellow-400/70 transition-all cursor-pointer hover:scale-[1.02] transform relative overflow-hidden"
                    style={{
                      background: deck.themeColors ? getThemeGradient(deck.themeColors) : "hsl(214,35%,22%)"
                    }}
                  >
                    {/* Effet d'étoiles filantes pour les decks complets */}
                    {deck.cardCount === 12 && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {Array.from({length: 8}).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-px h-8 bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-70"
                            style={{
                              top: `${-10 + Math.random() * 20}%`,
                              left: `${Math.random() * 100}%`,
                              transform: `rotate(${20 + Math.random() * 20}deg)`,
                              animation: `shooting-star ${2 + Math.random() * 3}s ease-in-out infinite`,
                              animationDelay: `${Math.random() * 4}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <h4 className="font-bold text-lg font-luckiest" style={{
                        color: deck.themeColors ? getThemeTextColor(deck.themeColors) : "#ffffff"
                      }}>{deck.name}</h4>
                      <span className="text-xs" style={{
                        color: deck.themeColors ? `${getThemeTextColor(deck.themeColors)}80` : "#9ca3af"
                      }}>{deck.cardCount}/12</span>
                    </div>
                    
                    {/* Preview des 3 premières cartes */}
                    <div className="h-32 rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 flex items-center p-3">
                      {deck.previewCards && deck.previewCards.length > 0 ? (
                        <div className="flex space-x-3 w-full perspective-1000">
                          {deck.previewCards.map((cardData: any, index: number) => (
                            <div 
                              key={index}
                              className="relative flex-1 transform hover:scale-105 transition-all duration-300 hover:z-10"
                              style={{
                                transform: `perspective(800px) rotateY(${index * 5}deg)`,
                                marginLeft: index > 0 ? '-20px' : '0'
                              }}
                            >
                              <CardDisplay
                                card={cardData.card}
                                variant="compact"
                                showActions={false}
                                className="w-full shadow-lg border border-gray-600"
                              />
                            </div>
                          ))}
                          {deck.previewCards.length < 3 && (
                            <div className="flex-1 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                              +{12 - deck.cardCount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                          Deck vide
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400">Aucun deck trouvé</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            {featuredCards.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredCards.map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={card}
                    viewMode="grid"
                    showActions={false}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400">Aucune carte mise en avant</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            {/* Search and filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher des cartes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-white placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSaleFilter('all')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'all' 
                        ? "bg-[hsl(9,85%,67%)] text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setSaleFilter('available')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'available' 
                        ? "bg-[hsl(9,85%,67%)] text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    À la vente
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "text-gray-400"}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-[hsl(9,85%,67%)] text-white" : "text-gray-400"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filteredMarketplaceCards.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMarketplaceCards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      viewMode="grid"
                      showActions={false}
                      showTradeInfo={true}
                      variant="detailed"
                      context="sale"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMarketplaceCards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      viewMode="list"
                      showActions={false}
                      showTradeInfo={false}
                      variant="detailed"
                      context="sale"
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400">Aucune carte en vente</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-4">
            {marketplaceCards.filter(card => card.isSold).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {marketplaceCards.filter(card => card.isSold).map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={card}
                    viewMode="grid"
                    showActions={false}
                    showTradeInfo={true}
                    variant="detailed"
                    context="sale"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400">Aucune carte vendue</div>
              </div>
            )}
          </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}