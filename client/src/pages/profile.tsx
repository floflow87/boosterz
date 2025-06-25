import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MoreVertical, UserPlus, UserMinus, MessageSquare, UserX, Grid, LayoutGrid, Star, Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

interface Collection {
  id: number;
  name: string;
  totalCards: number;
  ownedCards: number;
  completionPercentage: number;
  imageUrl?: string;
  backgroundColor?: string;
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
  user?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

export default function Profile() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId ? parseInt(params.userId) : null;
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [cardView, setCardView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('une');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États pour les likes et commentaires
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postComments, setPostComments] = useState<Record<number, any[]>>({});

  // Récupérer les informations de l'utilisateur actuel pour vérifier si c'est son propre profil
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Récupérer les informations de l'utilisateur du profil
  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Récupérer les collections de l'utilisateur
  const { data: collections = [], isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: [`/api/users/${userId}/collections`],
    enabled: !!userId,
  });

  // Récupérer les cartes de la collection sélectionnée
  const { data: cards = [], isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${selectedCollection}/cards`],
    enabled: !!selectedCollection,
  });

  // Récupérer les cartes en vente de l'utilisateur (personal cards)
  const { data: saleCards = [] } = useQuery({
    queryKey: [`/api/users/${userId}/sale-cards`],
    enabled: !!userId && activeTab === 'vente',
  });

  // Récupérer les posts de l'utilisateur
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: [`/api/users/${userId}/posts`],
    enabled: !!userId && activeTab === 'une',
  });

  // Récupérer les decks de l'utilisateur pour compter le nombre réel
  const { data: userDecks = [] } = useQuery({
    queryKey: [`/api/users/${userId}/decks`],
    enabled: !!userId,
  });

  // Sélectionner automatiquement la première collection
  useEffect(() => {
    if (collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0].id);
    }
  }, [collections, selectedCollection]);

  // Mutation pour suivre/ne plus suivre un utilisateur
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      if (action === 'follow') {
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });
        return response.json();
      } else {
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Succès",
        description: "Action effectuée avec succès",
        className: "bg-green-600 text-white border-green-700",
      });
    },
  });

  const handleFollow = () => {
    if (!profileUser) return;
    followMutation.mutate(profileUser.isFollowing ? 'unfollow' : 'follow');
  };

  const handleContact = () => {
    setLocation(`/chat/${userId}`);
  };

  const handleBlock = () => {
    toast({
      title: "Utilisateur bloqué",
      description: "Cet utilisateur a été bloqué",
      className: "bg-red-600 text-white border-red-700",
    });
  };

  // Mutation pour liker/unliker un post
  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest(`/api/posts/${postId}/like`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data, postId) => {
      const newLikedPosts = new Set(likedPosts);
      if (data.liked) {
        newLikedPosts.add(postId);
      } else {
        newLikedPosts.delete(postId);
      }
      setLikedPosts(newLikedPosts);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
    }
  });

  const handleLike = (postId: number) => {
    likeMutation.mutate(postId);
  };

  // Charger les commentaires d'un post
  const { data: commentsData } = useQuery({
    queryKey: [`/api/posts/${showComments.size > 0 ? Array.from(showComments)[0] : 0}/comments`],
    enabled: showComments.size > 0,
  });

  // Gérer l'affichage des commentaires
  const toggleComments = (postId: number) => {
    const newShowComments = new Set(showComments);
    if (newShowComments.has(postId)) {
      newShowComments.delete(postId);
    } else {
      newShowComments.add(postId);
      // Charger les commentaires depuis l'API
      queryClient.fetchQuery({
        queryKey: [`/api/posts/${postId}/comments`],
      }).then((comments) => {
        setPostComments(prev => ({
          ...prev,
          [postId]: comments || []
        }));
      });
    }
    setShowComments(newShowComments);
  };

  // Mutation pour ajouter un commentaire
  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await apiRequest(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      return response;
    },
    onSuccess: (data, { postId }) => {
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setCommentInputs(prev => ({
        ...prev,
        [postId]: ""
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
    }
  });

  const addComment = (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    commentMutation.mutate({ postId, content });
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Profil non trouvé</div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Utilisateur non trouvé</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.user?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(214,35%,11%)] border-b border-[hsl(214,35%,30%)]">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation('/social')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white">Profil</h1>
          
          {!isOwnProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-600">
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 cursor-pointer"
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                >
                  {profileUser.isFollowing ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Ne plus suivre
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Suivre
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 cursor-pointer"
                  onClick={handleContact}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contacter
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 cursor-pointer"
                  onClick={handleBlock}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Bloquer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Profile Header - Design selon l'image */}
      <div className="bg-[hsl(214,35%,22%)] px-6 pt-8 pb-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar principal avec fond arrondi */}
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center overflow-hidden">
            {profileUser.avatar ? (
              <img 
                src={profileUser.avatar} 
                alt={profileUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">{profileUser.name.charAt(0)}</span>
            )}
          </div>
          
          {/* Nom complet en majuscules */}
          <h1 className="text-xl font-bold text-white tracking-wide">{profileUser.name.toUpperCase()}</h1>
          
          {/* Pseudo grisé */}
          <p className="text-gray-400 text-sm">@{profileUser.username}</p>
          
          {/* Description */}
          {profileUser.bio ? (
            <p className="text-gray-300 text-xs max-w-xs leading-relaxed">
              {profileUser.bio}
            </p>
          ) : (
            <p className="text-gray-500 text-xs italic">
              Description lorem ipsum
            </p>
          )}
          
          {/* KPIs intégrés dans le header */}
          <div className="grid grid-cols-3 gap-8 pt-4 w-full max-w-xs">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileUser.totalCards || 0}</div>
              <div className="text-xs text-gray-400">Cartes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{userDecks.length}</div>
              <div className="text-xs text-gray-400">Decks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileUser.followersCount || 0}</div>
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
            
            {/* À la une Tab Content */}
            <TabsContent value="posts" className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                        {profileUser.avatar ? (
                          <img 
                            src={profileUser.avatar} 
                            alt={profileUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {profileUser.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{profileUser.name}</p>
                        <p className="text-gray-400 text-xs">@{profileUser.username}</p>
                      </div>
                    </div>
                    
                    <p className="text-white text-sm leading-relaxed mb-3">{post.content}</p>
                    
                    {post.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={post.imageUrl} 
                          alt="Post image" 
                          className="w-full rounded-lg max-h-64 object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-gray-400">
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 hover:text-white transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">0</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-white transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">0</span>
                        </button>
                      </div>
                      <span className="text-xs">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">Aucune activité récente</div>
              </div>
            )}
          </TabsContent>

          {/* En vente Tab Content */}
          <TabsContent value="marketplace" className="space-y-4">
            {saleCards.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {saleCards.map((card) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden rounded-lg border border-green-500/30 bg-green-500/5"
                  >
                    <div className="aspect-[3/4]">
                      <img
                        src={card.imageUrl}
                        alt={`${card.playerName} - ${card.teamName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white text-sm leading-tight truncate">
                            {card.playerName}
                          </p>
                          <p className="text-gray-400 text-xs truncate">{card.teamName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-400"
                        >
                          {card.reference}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs border-green-600 text-green-400"
                        >
                          En vente
                        </Badge>
                      </div>
                      
                      {card.salePrice && (
                        <div className="text-sm font-semibold text-green-400">
                          {card.salePrice}
                        </div>
                      )}
                      
                      {card.saleDescription && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {card.saleDescription}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">Aucune carte en vente</div>
              </div>
            )}
          </TabsContent>

          {/* Decks Tab Content */}
          <TabsContent value="decks" className="space-y-4">
            {userDecks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userDecks.map((deck) => (
                  <div 
                    key={deck.id} 
                    onClick={() => setLocation(`/deck/${deck.id}`)}
                    className="bg-[hsl(214,35%,22%)] rounded-2xl p-4 border-2 border-yellow-500/50 hover:border-yellow-400/70 transition-all cursor-pointer hover:scale-[1.02] transform"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white text-lg">{deck.name}</h4>
                      <span className="text-xs text-gray-400">{deck.cardCount}/12 cartes</span>
                    </div>
                    
                    <div className="h-32 rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
                      <div className="text-gray-400 text-sm">Deck de {deck.cardCount} cartes</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">Aucun deck créé</div>
              </div>
            )}
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}