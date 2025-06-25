import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Heart, MessageCircle, Share2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Deck {
  id: number;
  name: string;
  description?: string;
  theme?: string;
  cardCount: number;
}

export default function Profile() {
  const { userId: id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");

  const { data: profileUser, isLoading: isUserLoading, error: userError } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });

  // Debug logging
  console.log("Profile page - user ID:", id);
  console.log("Profile user data:", profileUser);
  console.log("Is loading:", isUserLoading);
  console.log("Error:", userError);

  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: [`/api/users/${id}/posts`],
    enabled: !!id,
  });

  const { data: saleCards = [], isLoading: isSaleCardsLoading } = useQuery({
    queryKey: [`/api/users/${id}/sale-cards`],
    enabled: !!id,
  });

  const { data: userDecks = [], isLoading: isDecksLoading } = useQuery({
    queryKey: [`/api/users/${id}/decks`],
    enabled: !!id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/me"],
  });

  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      const response = await fetch(`/api/users/${id}/follow`, {
        method: action === 'follow' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to ${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      toast({
        title: profileUser?.isFollowing ? "Désabonné" : "Abonné",
        description: profileUser?.isFollowing 
          ? `Vous ne suivez plus @${profileUser?.username}` 
          : `Vous suivez maintenant @${profileUser?.username}`,
        className: "bg-green-600 text-white border-green-700",
      });
    },
  });

  const handleFollow = () => {
    const action = profileUser?.isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate(action);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!profileUser && !isUserLoading) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Utilisateur introuvable</h2>
          <p className="text-gray-400">Cet utilisateur n'existe pas ou a été supprimé.</p>
          <p className="text-xs text-gray-500 mt-2">ID: {id}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.user?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      {/* Header avec logo BOOSTERZ et halo */}
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Flèche retour et logo BOOSTERZ */}
          <div className="relative flex items-center space-x-3">
            {/* Halo main color derrière la flèche */}
            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-32 h-32 bg-[hsl(9,85%,67%)] opacity-15 rounded-full blur-2xl"></div>
            <button 
              onClick={() => {
                setLocation("/social");
              }}
              className="text-white hover:text-gray-300 transition-colors relative z-10"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg z-10" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
              BOOSTER<span className="text-[hsl(9,85%,67%)]">Z</span>
            </h1>
          </div>
          
          {/* Icônes à droite */}
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-[hsl(214,35%,22%)] hover:bg-[hsl(214,35%,28%)] transition-colors relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => setLocation("/settings")}
              className="p-2 rounded-full bg-[hsl(214,35%,22%)] hover:bg-[hsl(214,35%,28%)] transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <main className="pb-6">
        {/* Header centré */}
        <div className="text-center px-6 py-8">
          {/* Avatar dynamique */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-orange-400">
            {profileUser.avatar && (profileUser.avatar.startsWith('data:image') || profileUser.avatar.startsWith('http')) ? (
              <img 
                src={profileUser.avatar} 
                alt={profileUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {profileUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Nom avec taille ajustée */}
          <h1 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
            {profileUser.name.toUpperCase()}
          </h1>
          <p className="text-gray-400 mb-3 text-sm">@{profileUser.username}</p>

          {/* Description */}
          {profileUser.bio && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-md mx-auto">
              {profileUser.bio}
            </p>
          )}

          {/* Bouton Follow seulement */}
          {!isOwnProfile && !profileUser.isFollowing && (
            <Button
              onClick={handleFollow}
              disabled={followMutation.isPending}
              className="px-6 py-2 rounded-full font-medium transition-colors bg-[hsl(27,96%,61%)] hover:bg-[hsl(27,96%,55%)] text-white"
            >
              {followMutation.isPending ? "..." : "Suivre"}
            </Button>
          )}

          {/* KPIs dans l'ordre demandé */}
          <div className="flex justify-center space-x-8 mt-6">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileUser.totalCards || 0}</div>
              <div className="text-sm text-gray-400">Cartes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileUser.followersCount || 0}</div>
              <div className="text-sm text-gray-400">Abonnés</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileUser.collectionsCount || 0}</div>
              <div className="text-sm text-gray-400">Decks</div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[hsl(214,35%,11%)]">
            <TabsList className="w-full h-auto p-0 bg-transparent">
              <TabsTrigger
                value="posts"
                className="flex-1 py-4 text-gray-400 border-b-2 border-transparent data-[state=active]:text-white data-[state=active]:border-[#F37261] data-[state=active]:bg-transparent"
              >
                À la une
              </TabsTrigger>
              <TabsTrigger
                value="marketplace"
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

          {/* Contenu des onglets */}
          <div className="px-4 pt-4">
            {/* À la une Tab Content */}
            <TabsContent value="posts" className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="bg-[hsl(216,46%,13%)] rounded-xl p-4 border border-gray-700/30">
                    {/* Header du post avec avatar et nom */}
                    <div className="flex items-center space-x-3 mb-3">
                      {profileUser.avatar && (profileUser.avatar.startsWith('data:image') || profileUser.avatar.startsWith('http')) ? (
                        <img 
                          src={profileUser.avatar} 
                          alt={profileUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {profileUser.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold text-sm">
                            {profileUser.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            @{profileUser.username}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenu du post */}
                    <div className="text-white text-sm leading-relaxed mb-3 pl-13">
                      {post.content}
                    </div>

                    {post.imageUrl && (
                      <div className="mb-3 pl-13">
                        <img 
                          src={post.imageUrl} 
                          alt="Post image" 
                          className="w-full rounded-lg max-h-64 object-cover"
                        />
                      </div>
                    )}

                    {/* Compteurs */}
                    <div className="flex items-center space-x-4 text-gray-400 text-sm pl-13 mb-2">
                      <span>1 j'aime</span>
                      <span>3 commentaires</span>
                    </div>

                    {/* Actions du post */}
                    <div className="flex items-center space-x-6 text-gray-400 pl-13 pt-2 border-t border-gray-700/30">
                      <button className="flex items-center space-x-1 hover:text-red-400 transition-colors py-2">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">J'aime</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors py-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Commenter</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">Aucun post</div>
                  <p className="text-sm text-gray-500">
                    Les posts apparaîtront ici
                  </p>
                </div>
              )}
            </TabsContent>

            {/* En vente Tab Content */}
            <TabsContent value="marketplace" className="space-y-4">
              {saleCards.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {saleCards.map((card) => (
                    <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-3">
                      <div className="aspect-[3/4] bg-gray-600 rounded mb-2 flex items-center justify-center">
                        <div className="text-gray-400 text-xs text-center">
                          {card.playerName || 'Carte'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white font-medium text-sm">{card.playerName || 'Nom du joueur'}</h4>
                        <p className="text-gray-400 text-xs">{card.teamName || 'Équipe'}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[hsl(9,85%,67%)] font-bold text-sm">
                            {card.salePrice || "Prix non défini"}
                          </span>
                          <span className="text-green-400 text-xs">En vente</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">Aucune carte en vente</div>
                  <p className="text-sm text-gray-500">
                    Les cartes en vente apparaîtront ici
                  </p>
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
                      className="bg-[hsl(214,35%,22%)] rounded-lg p-4 cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors"
                    >
                      <h3 className="text-white font-medium mb-2">{deck.name}</h3>
                      <p className="text-gray-400 text-sm">{deck.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">{deck.cardCount || 0} cartes</span>
                        <span className="text-xs text-gray-500">{deck.theme || 'Aucun thème'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">Aucun deck</div>
                  <p className="text-sm text-gray-500">
                    Les decks créés apparaîtront ici
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}