import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MoreVertical, UserPlus, UserMinus, MessageSquare, UserX, Grid, LayoutGrid, Star } from "lucide-react";
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

  // Récupérer les informations de l'utilisateur actuel pour vérifier si c'est son propre profil
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
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

  // Récupérer les cartes en vente de l'utilisateur
  const { data: saleCards = [] } = useQuery<Card[]>({
    queryKey: [`/api/users/${userId}/marketplace`],
    enabled: !!userId && activeTab === 'vente',
  });

  // Récupérer les posts de l'utilisateur
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: [`/api/users/${userId}/posts`],
    enabled: !!userId && activeTab === 'une',
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

  if (!match || !userId) {
    return <div>Profil non trouvé</div>;
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

  const isOwnProfile = currentUser?.id === profileUser.id;

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

      {/* Profile Header */}
      <div className="px-4 py-6 border-b border-[hsl(214,35%,30%)]">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden">
            {profileUser.avatar ? (
              <img 
                src={profileUser.avatar} 
                alt={`Avatar de ${profileUser.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {profileUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{profileUser.name}</h2>
            <p className="text-gray-400">@{profileUser.username}</p>
            {profileUser.bio && (
              <p className="text-gray-300 text-sm mt-2">{profileUser.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">{profileUser.totalCards}</div>
            <div className="text-xs text-gray-400">Cartes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{profileUser.collectionsCount}</div>
            <div className="text-xs text-gray-400">Collections</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{profileUser.followersCount}</div>
            <div className="text-xs text-gray-400">Abonnés</div>
          </div>
        </div>
      </div>

      <main className="pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[73px] z-40 bg-[hsl(214,35%,11%)] border-b border-[hsl(214,35%,30%)]">
            <TabsList className="w-full h-auto p-0 bg-transparent">
              <TabsTrigger
                value="une"
                className="flex-1 py-4 text-gray-400 border-b-2 border-transparent data-[state=active]:text-white data-[state=active]:border-[#F37261] data-[state=active]:bg-transparent"
              >
                À la une
              </TabsTrigger>
              <TabsTrigger
                value="vente"
                className="flex-1 py-4 text-gray-400 border-b-2 border-transparent data-[state=active]:text-white data-[state=active]:border-[#F37261] data-[state=active]:bg-transparent"
              >
                En vente
              </TabsTrigger>
              <TabsTrigger
                value="decks"
                className="flex-1 py-4 text-gray-400 border-b-2 border-transparent data-[state=active]:text-white data-[state=active]:border-[#F37261] data-[state=active]:bg-transparent"
              >
                Decks
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Onglet À la une - Posts et activités */}
          <TabsContent value="une" className="px-4 pt-4 space-y-4">
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-[hsl(214,35%,18%)] border-[hsl(214,35%,30%)]">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {profileUser.avatar ? (
                            <img 
                              src={profileUser.avatar} 
                              alt={`Avatar de ${profileUser.name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {profileUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-white">{profileUser.name}</span>
                            <span className="text-gray-400 text-sm">@{profileUser.username}</span>
                            <span className="text-gray-500 text-sm">
                              {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          {post.title && (
                            <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                          )}
                          <p className="text-gray-300 mb-3">{post.content}</p>
                          {post.imageUrl && (
                            <div className="rounded-lg overflow-hidden mb-3">
                              <img 
                                src={post.imageUrl} 
                                alt="Image du post"
                                className="w-full max-h-64 object-cover"
                              />
                            </div>
                          )}
                          {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {post.images.map((image, index) => (
                                <div key={index} className="rounded-lg overflow-hidden">
                                  <img 
                                    src={image} 
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {post.playerName && post.teamName && (
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span>{post.playerName}</span>
                              <span>•</span>
                              <span>{post.teamName}</span>
                              {post.cardType && (
                                <>
                                  <span>•</span>
                                  <span>{post.cardType}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">Aucune activité récente</div>
              </div>
            )}
          </TabsContent>

          {/* Onglet En vente */}
          <TabsContent value="vente" className="px-4 pt-4 space-y-4">
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

          {/* Onglet Decks */}
          <TabsContent value="decks" className="px-4 pt-4 space-y-4">
            <div className="text-center py-8">
              <div className="text-gray-400">Fonctionnalité Decks à venir</div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}