import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Heart, MessageCircle, Share2, Bell, Send, Trash2, DollarSign, X, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import HaloBlur from "@/components/halo-blur";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import CardDisplay from "@/components/card-display";

interface User {
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
  isFollowing?: boolean;
}

interface Post {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  imageUrl?: string;
  images?: string[];
  playerName?: string;
  teamName?: string;
  cardType?: string;
  isForSale?: boolean;
  isForTrade?: boolean;
  condition?: string;
  likesCount?: number;
  user?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

interface Card {
  id: number;
  reference: string;
  playerName: string;
  teamName: string;
  imageUrl: string;
  cardType: string;
  rarity: string;
  isOwned: boolean;
  isForSale?: boolean;
  salePrice?: string;
  saleDescription?: string;
  isFeatured?: boolean;
}

interface Deck {
  id: number;
  name: string;
  description?: string;
  theme?: string;
  cardCount: number;
  themeColors?: string;
  previewCards?: any[];
}

interface CommentData {
  id: number;
  postId: number;
  userId: number;
  content: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const [pathname] = useLocation();
  const userId = pathname?.split("/")[2];
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postComments, setPostComments] = useState<Record<number, CommentData[]>>({});
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const { toast } = useToast();

  const { data: authData, isLoading: authLoading } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  const currentUserData = authData?.user;

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${userId}/posts`],
    enabled: !!userId,
  });

  const { data: likedPostIds } = useQuery<number[]>({
    queryKey: ["/api/posts/likes"],
  });

  const { data: userDecks } = useQuery<Deck[]>({
    queryKey: [`/api/users/${userId}/decks`],
    enabled: !!userId,
  });

  const { data: marketplaceCards = [] } = useQuery<Card[]>({
    queryKey: [`/api/users/${userId}/sale-cards`],
    enabled: !!userId,
  });

  const deckPreviews = userDecks || [];

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

        setPostLikes(prev => ({
          ...prev,
          [postId]: result.likesCount
        }));
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Toggle comments display
  const toggleComments = async (postId: number) => {
    if (showComments.has(postId)) {
      setShowComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setShowComments(prev => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      
      // Load comments if not already loaded
      if (!postComments[postId]) {
        try {
          const response = await fetch(`/api/posts/${postId}/comments`);
          if (response.ok) {
            const comments = await response.json();
            setPostComments(prev => ({
              ...prev,
              [postId]: comments
            }));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des commentaires:', error);
        }
      }
    }
  };

  // Add comment
  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const result = await response.json();
        
        setPostComments(prev => ({
          ...prev,
          [postId]: [{
            id: result.comment.id,
            postId: postId,
            userId: result.comment.userId,
            content: result.comment.content,
            userName: result.comment.user.name,
            userAvatar: result.comment.user.avatar,
            createdAt: new Date(result.comment.createdAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }, ...(prev[postId] || [])]
        }));

        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  // Initialize post likes and liked posts
  useEffect(() => {
    if (posts) {
      const initialLikes: Record<number, number> = {};
      posts.forEach(post => {
        initialLikes[post.id] = post.likesCount || 0;
      });
      setPostLikes(initialLikes);
    }
  }, [posts]);

  useEffect(() => {
    if (likedPostIds) {
      setLikedPosts(new Set(likedPostIds));
    }
  }, [likedPostIds]);

  const formatPostDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getThemeGradient = (themeColors: string) => {
    const gradients: Record<string, string> = {
      "Rouge & Blanc": "linear-gradient(135deg, #dc2626 0%, #fbbf24 100%)",
      "Bleu & Blanc": "linear-gradient(135deg, #2563eb 0%, #e5e7eb 100%)",
      "Vert & Blanc": "linear-gradient(135deg, #16a34a 0%, #f3f4f6 100%)",
      "Marine & Bronze": "linear-gradient(135deg, #1e3a8a 0%, #a3a3a3 100%)",
      "Or & Noir": "linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)",
      "Rouge & Noir": "linear-gradient(135deg, #dc2626 0%, #1f2937 100%)",
      "Bleu Blanc Rouge": "linear-gradient(135deg, #2563eb 0%, #f3f4f6 50%, #dc2626 100%)"
    };
    return gradients[themeColors] || "hsl(214,35%,22%)";
  };

  const getThemeTextColor = (themeColors: string) => {
    const textColors: Record<string, string> = {
      "Rouge & Blanc": "#ffffff",
      "Bleu & Blanc": "#ffffff", 
      "Vert & Blanc": "#ffffff",
      "Marine & Bronze": "#ffffff",
      "Or & Noir": "#fbbf24",
      "Rouge & Noir": "#dc2626",
      "Bleu Blanc Rouge": "#ffffff"
    };
    return textColors[themeColors] || "#ffffff";
  };

  if (userLoading) {
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
        {/* Header Profile */}
        <div className="bg-[hsl(214,35%,22%)] px-6 pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar principal */}
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`Avatar de ${user.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white">{user.name.charAt(0)}</span>
              )}
            </div>
            
            {/* Nom et username */}
            <div>
              <h1 className="text-xl font-bold text-white font-luckiest">{user.name}</h1>
              <p className="text-gray-400 text-sm">@{user.username}</p>
              {user.bio && (
                <p className="text-gray-300 text-sm mt-2 max-w-xs">{user.bio}</p>
              )}
            </div>

            {/* KPIs */}
            <div className="flex justify-center space-x-8 w-full">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{user.followersCount || 0}</div>
                <div className="text-xs text-gray-400">Abonnés</div>
              </div>
            </div>
          </div>
          
          {/* Onglets */}
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
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)]">
                    {/* Post Header */}
                    <div className="p-4 border-b border-[hsl(214,35%,30%)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium text-sm">{user.name}</span>
                              <span className="text-xs text-gray-400">@{user.username}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatPostDate(post.createdAt)}
                            </div>
                          </div>
                        </div>
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

                      {/* Interaction Buttons - Structure identique à la page social */}
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
                          {/* Add comment - Optimisé pour mobile */}
                          <div className="flex gap-2 items-center px-1">
                            <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
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
                            <Input
                              placeholder="Écrivez..."
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
                              className="bg-[hsl(214,35%,18%)] border-[hsl(214,35%,30%)] text-white placeholder:text-gray-400 text-sm flex-1 h-8 px-2"
                            />
                            <Button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white h-8 px-2 text-xs font-medium flex-shrink-0"
                            >
                              Publier
                            </Button>
                          </div>

                          {/* Comments list */}
                          {postComments[post.id] && postComments[post.id].length > 0 && (
                            <div className="space-y-2">
                              {postComments[post.id].map((comment) => (
                                <div key={comment.id} className="flex space-x-3 p-3 bg-[hsl(214,35%,18%)] rounded-lg">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                                    {comment.user?.avatar ? (
                                      <img 
                                        src={comment.user.avatar} 
                                        alt={`Avatar de ${comment.user.name}`}
                                        className="w-full h-full object-cover"
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
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-white">{comment.user?.name}</span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
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

          {/* En vente Tab Content - Affichage des cartes en vente avec le même layout que collections */}
          <TabsContent value="marketplace" className="space-y-4">
            {marketplaceCards && marketplaceCards.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {marketplaceCards.map((card) => (
                  <div 
                    key={card.id} 
                    className="bg-[hsl(214,35%,22%)] rounded-lg p-3 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer relative"
                    onClick={() => setSelectedCard(card)}
                  >
                    {/* Badge "En vente" */}
                    <div className="absolute top-2 right-2 bg-[hsl(9,85%,67%)] text-white px-2 py-1 rounded-full font-bold text-xs z-10">
                      EN VENTE
                    </div>
                    
                    {card.imageUrl && (
                      <img 
                        src={card.imageUrl} 
                        alt={`${card.playerName || 'Carte'}`}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                    )}
                    
                    <div className="space-y-1">
                      {/* Nom du joueur */}
                      {card.playerName && (
                        <h4 className="text-white font-medium text-sm truncate">{card.playerName}</h4>
                      )}
                      
                      {/* Équipe */}
                      {card.teamName && (
                        <p className="text-gray-400 text-xs truncate">{card.teamName}</p>
                      )}
                      
                      {/* Collection et Prix sur la même ligne */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-gray-500 text-xs truncate">
                          {card.collectionName || 'Score Ligue 1'}
                        </div>
                        {card.salePrice && (
                          <div className="text-[hsl(9,85%,67%)] text-xs font-bold">
                            {card.salePrice}€
                          </div>
                        )}
                      </div>
                      
                      {/* Saison en dessous */}
                      <div className="text-gray-500 text-xs">
                        {card.season || '23/24'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune carte en vente</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Les cartes mises en vente par cet utilisateur apparaîtront ici.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decks" className="space-y-4">
            {userDecks && userDecks.length > 0 ? (
              <div className="space-y-4">
                {userDecks.map((deck: any) => (
                  <div 
                    key={deck.id} 
                    onClick={() => setLocation(`/deck/${deck.id}`)}
                    className="rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transform transition-all duration-300 relative overflow-hidden"
                    style={{
                      background: deck.themeColors ? getThemeGradient(deck.themeColors) : "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)"
                    }}
                  >
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <h4 className="font-bold text-lg font-luckiest uppercase text-white">{deck.name}</h4>
                      <span className="text-xs text-white/80">{deck.cardCount || 0}/12</span>
                    </div>
                    
                    {/* Preview des cartes du deck */}
                    <div className="h-32 rounded-lg overflow-hidden bg-black/20 flex items-center p-3">
                      {deck.previewCards && deck.previewCards.length > 0 ? (
                        <div className="flex space-x-3 w-full">
                          {deck.previewCards.slice(0, 3).map((cardData: any, index: number) => (
                            <div 
                              key={index}
                              className="relative flex-1 max-w-[80px]"
                            >
                              <div className="aspect-[3/4] bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden border border-white/20 shadow-lg">
                                {cardData.card?.imageUrl ? (
                                  <img 
                                    src={cardData.card.imageUrl} 
                                    alt={cardData.card.playerName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white text-xs text-center p-1">
                                    {cardData.card?.playerName || 'Carte'}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Afficher les emplacements vides si moins de 3 cartes */}
                          {deck.previewCards.length < 3 && Array.from({ length: 3 - deck.previewCards.length }).map((_, index) => (
                            <div 
                              key={`empty-${index}`}
                              className="relative flex-1 max-w-[80px]"
                            >
                              <div className="aspect-[3/4] bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                                <div className="text-white/40 text-xs">Vide</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full flex space-x-3">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div 
                              key={`placeholder-${index}`}
                              className="relative flex-1 max-w-[80px]"
                            >
                              <div className="aspect-[3/4] bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                                <div className="text-white/40 text-xs">Vide</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">Aucun deck créé</div>
                <p className="text-sm text-gray-500">
                  Les decks apparaîtront ici une fois créés
                </p>
              </div>
            )}
          </TabsContent>

              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <Navigation />

      {/* Modal de visualisation de carte */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(216,46%,13%)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[hsl(214,35%,30%)]">
            <div className="p-6">
              {/* Header du modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedCard.playerName}</h2>
                  <p className="text-gray-400">{selectedCard.teamName} • {selectedCard.cardType}</p>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Image de la carte */}
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg overflow-hidden border border-[hsl(214,35%,30%)]">
                    {selectedCard.imageUrl ? (
                      <img
                        src={selectedCard.imageUrl}
                        alt={selectedCard.playerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <div className="text-xl font-bold mb-2">{selectedCard.playerName}</div>
                          <div className="text-sm text-gray-300">{selectedCard.teamName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails de la carte */}
                <div className="space-y-6">
                  {/* Prix et état */}
                  <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">Prix de vente</span>
                      <div className="bg-[hsl(9,85%,67%)] text-white px-3 py-1 rounded-md text-sm font-medium">
                        En vente
                      </div>
                    </div>
                    <div className="text-[hsl(9,85%,67%)] text-3xl font-bold mb-2">
                      {selectedCard.salePrice ? `${selectedCard.salePrice}€` : 'Prix à négocier'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      État: Near Mint
                    </div>
                  </div>

                  {/* Description */}
                  {selectedCard.saleDescription && (
                    <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                      <h3 className="text-white font-medium mb-2">Description</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {selectedCard.saleDescription}
                      </p>
                    </div>
                  )}

                  {/* Informations de la carte */}
                  <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                    <h3 className="text-white font-medium mb-3">Informations</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type de carte:</span>
                        <span className="text-white">{selectedCard.cardType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Équipe:</span>
                        <span className="text-white">{selectedCard.teamName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Joueur:</span>
                        <span className="text-white">{selectedCard.playerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 bg-[hsl(9,85%,67%)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[hsl(9,85%,60%)] transition-colors">
                      Contacter le vendeur
                    </button>
                    <button className="bg-[hsl(214,35%,30%)] text-white p-3 rounded-lg hover:bg-[hsl(214,35%,35%)] transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}