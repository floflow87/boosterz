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

      <main className="relative z-10 px-4 pb-24">
        {/* User Info */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-gray-400">@{user.username}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{collections.length}</div>
              <div className="text-xs text-gray-400">Decks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{user.totalCards || 0}</div>
              <div className="text-xs text-gray-400">Cartes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{Math.round(user.completionPercentage || 0)}%</div>
              <div className="text-xs text-gray-400">Complétées</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-[hsl(214,35%,22%)] mb-6">
            <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
            <TabsTrigger value="collections" className="text-xs">Collections</TabsTrigger>
            <TabsTrigger value="decks" className="text-xs">Decks</TabsTrigger>
            <TabsTrigger value="featured" className="text-xs">À la une</TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs">Marché</TabsTrigger>
            <TabsTrigger value="sold" className="text-xs">Vendues</TabsTrigger>
          </TabsList>

          {/* Posts Tab Content */}
          <TabsContent value="posts" className="space-y-4">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Chargement des posts...</div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostComponent
                    key={post.id}
                    post={{...post, user: user}}
                    currentUser={{user: currentUserData}}
                    likedPosts={likedPosts}
                    showComments={showComments}
                    postComments={postComments}
                    postCommentsCount={postCommentsCount}
                    commentInputs={commentInputs}
                    onLike={handleLike}
                    onToggleComments={toggleComments}
                    onUpdateCommentInput={(postId, value) => setCommentInputs(prev => ({ ...prev, [postId]: value }))}
                    onAddComment={handleAddComment}
                    onUserClick={(username) => setLocation(`/profile/${username}`)}
                  />
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

          <TabsContent value="collections" className="space-y-4">
            {collections.length > 0 ? (
              <div className="grid gap-4">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    onClick={() => setLocation(`/collections/${collection.id}`)}
                    className="bg-[hsl(214,35%,22%)] rounded-lg p-4 cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{collection.name}</h3>
                        <p className="text-sm text-gray-400">
                          {collection.ownedCards || 0} / {collection.totalCards || 0} cartes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#F37261]">
                          {Math.round(collection.completionPercentage || 0)}%
                        </div>
                        <div className="text-xs text-gray-400">Complétée</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400">Aucune collection trouvée</div>
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
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}