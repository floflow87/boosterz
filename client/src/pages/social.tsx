import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, UserPlus, UserCheck, Bell, Star, TrendingUp, Search, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

interface Activity {
  id: number;
  type: string;
  user: SocialUser;
  card?: {
    id: number;
    reference: string;
    playerName: string;
    teamName: string;
    imageUrl?: string;
  };
  collection?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  fromUser?: SocialUser;
  card?: {
    id: number;
    reference: string;
    playerName: string;
  };
  createdAt: string;
}

export default function Social() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("forsale");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les utilisateurs
  const { data: users = [], isLoading: usersLoading } = useQuery<SocialUser[]>({
    queryKey: ["/api/social/users"],
  });

  // Récupérer les activités
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/social/activities"],
  });

  // Récupérer les notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<NotificationItem[]>({
    queryKey: ["/api/social/notifications"],
  });

  // Mutation pour suivre/arrêter de suivre un utilisateur
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: "follow" | "unfollow" }) => {
      return apiRequest(`/api/social/users/${userId}/${action}`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/users"] });
      toast({
        title: "Succès",
        description: "Action effectuée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer cette action",
        variant: "destructive",
      });
    },
  });

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "added_card":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "marked_for_trade":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case "completed_collection":
        return <Star className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: Activity) => {
    switch (activity.type) {
      case "added_card":
        return `a ajouté ${activity.card?.playerName} à sa collection`;
      case "marked_for_trade":
        return `propose ${activity.card?.playerName} en échange`;
      case "completed_collection":
        return `a complété la collection ${activity.collection?.name}`;
      default:
        return "activité inconnue";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden">
      <HaloBlur />
      
      <Header title="Communauté" showBackButton />

      <main className="relative z-10 px-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-50 pb-4 mb-4 bg-[hsl(216,46%,13%)] pt-2 -mx-4 px-4">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide min-h-[44px] items-center pl-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setActiveTab("forsale")}
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
                  activeTab === "forsale" 
                    ? "text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                style={activeTab === "forsale" ? { backgroundColor: '#F37261' } : {}}
              >
                <Star className="w-3 h-3 mr-1 inline" />
                À la vente
              </button>
              <button
                onClick={() => setActiveTab("discover")}
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
                  activeTab === "discover" 
                    ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Users className="w-3 h-3 mr-1 inline" />
                Découvrir
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 mr-2 ${
                  activeTab === "activity" 
                    ? "bg-purple-600 text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1 inline" />
                Activité
              </button>
            </div>
          </div>

          <TabsContent value="discover" className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher des collectionneurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-white placeholder:text-gray-400"
              />
            </div>

            {/* Liste des utilisateurs */}
            <div className="space-y-3">
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Chargement...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun collectionneur trouvé</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white font-bold">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{user.name}</h3>
                          <p className="text-sm text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setLocation('/chat')}
                          variant="outline"
                          size="sm"
                          className="border-gray-400 text-gray-400 hover:bg-gray-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          onClick={() => followMutation.mutate({
                            userId: user.id,
                            action: user.isFollowing ? "unfollow" : "follow"
                          })}
                          disabled={followMutation.isPending}
                          variant={user.isFollowing ? "outline" : "default"}
                          size="sm"
                          className={user.isFollowing 
                            ? "border-gray-400 text-gray-400 hover:bg-gray-700" 
                            : "bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,57%)]"
                          }
                        >
                          {user.isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Suivi
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Suivre
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-gray-300 mb-3">{user.bio}</p>
                    )}

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm font-semibold text-[hsl(9,85%,67%)]">{user.totalCards}</div>
                        <div className="text-xs text-gray-400">Cartes</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[hsl(9,85%,67%)]">{user.collectionsCount}</div>
                        <div className="text-xs text-gray-400">Collections</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[hsl(9,85%,67%)]">{user.followersCount}</div>
                        <div className="text-xs text-gray-400">Followers</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[hsl(9,85%,67%)]">{user.completionPercentage}%</div>
                        <div className="text-xs text-gray-400">Complété</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-[hsl(214,35%,30%)] text-gray-300 hover:bg-[hsl(214,35%,30%)]"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir la collection
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Chargement...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Aucune activité récente</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center text-white font-bold">
                      {activity.user.avatar ? (
                        <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        activity.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActivityIcon(activity.type)}
                        <span className="font-semibold text-white">{activity.user.name}</span>
                        <span className="text-gray-400">{getActivityMessage(activity)}</span>
                      </div>
                      
                      {activity.card && (
                        <div className="flex items-center space-x-2 mt-2 p-2 bg-[hsl(214,35%,18%)] rounded">
                          {activity.card.imageUrl && (
                            <img 
                              src={activity.card.imageUrl} 
                              alt={activity.card.playerName}
                              className="w-8 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="text-sm text-white">{activity.card.playerName}</div>
                            <div className="text-xs text-gray-400">{activity.card.teamName} • {activity.card.reference}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {formatTimeAgo(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="forsale" className="space-y-4">
            {/* Mock cards for sale - Replace with real API call */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  id: 1,
                  playerName: "Kylian Mbappé",
                  teamName: "PSG",
                  cardType: "Base",
                  price: "15€",
                  imageUrl: null,
                  seller: "Alex_Collector"
                },
                {
                  id: 2,
                  playerName: "Lionel Messi",
                  teamName: "PSG", 
                  cardType: "Parallel Laser",
                  price: "45€",
                  imageUrl: null,
                  seller: "CardMaster92"
                },
                {
                  id: 3,
                  playerName: "Neymar Jr",
                  teamName: "PSG",
                  cardType: "Insert Keepers",
                  price: "30€",
                  imageUrl: null,
                  seller: "PSG_Fan"
                }
              ].map((card) => (
                <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-3 border border-[hsl(214,35%,30%)]">
                  <div className="aspect-[3/4] bg-gray-600 rounded mb-2 flex items-center justify-center">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.playerName} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="text-gray-400 text-xs text-center">
                        Photo non disponible
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-medium text-sm">{card.playerName}</h4>
                    <p className="text-gray-400 text-xs">{card.teamName} • {card.cardType}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(9,85%,67%)] font-bold text-sm">{card.price}</span>
                      <span className="text-gray-400 text-xs">par {card.seller}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}