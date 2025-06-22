import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, UserPlus, UserCheck, Bell, Star, TrendingUp, Search, Eye, MessageCircle, Activity, ShoppingBag, ArrowLeftRight, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const [forSaleSearchTerm, setForSaleSearchTerm] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [searchPeople, setSearchPeople] = useState("");
  const [activeTab, setActiveTab] = useState("featured");
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

  // Récupérer les activités de l'utilisateur actuel
  const { data: userActivities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/users/1/posts"],
  });

  // Fonction pour convertir un fichier en base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Mutation pour créer un post
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const postData = { 
        content, 
        type: "text"
      };
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/activities"] });
      setNewPostContent("");
      setSelectedPhoto(null);
      setTaggedPeople([]);
      setSearchPeople("");
      toast({
        title: "Publication créée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur lors de la création",
        variant: "destructive",
      });
    }
  });

  // Fonction pour créer un post
  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      createPostMutation.mutate(newPostContent);
      setIsPostModalOpen(false);
    }
  };

  // Fonction pour ouvrir le modal de création de post
  const handleOpenPostModal = () => {
    setIsPostModalOpen(true);
  };

  // Fonction pour gérer l'upload de photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  // Fonction pour retirer la photo
  const removePhoto = () => {
    setSelectedPhoto(null);
  };

  // Filtrer les utilisateurs pour l'autocomplete des tags
  const filteredUsersForTags = users.filter(user =>
    user.name.toLowerCase().includes(searchPeople.toLowerCase()) ||
    user.username.toLowerCase().includes(searchPeople.toLowerCase())
  );

  // Ajouter une personne aux tags
  const addTaggedPerson = (username: string) => {
    if (!taggedPeople.includes(username)) {
      setTaggedPeople([...taggedPeople, username]);
      setSearchPeople("");
    }
  };

  // Retirer une personne des tags
  const removeTaggedPerson = (username: string) => {
    setTaggedPeople(taggedPeople.filter(person => person !== username));
  };



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

  // Mock cards for sale data
  const cardsForSale = [
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
    },
    {
      id: 4,
      playerName: "Gianluigi Donnarumma",
      teamName: "PSG",
      cardType: "Autograph",
      price: "85€",
      imageUrl: null,
      seller: "GoalKeeper_King"
    },
    {
      id: 5,
      playerName: "Karim Benzema",
      teamName: "Real Madrid",
      cardType: "Parallel Numbered",
      price: "120€",
      imageUrl: null,
      seller: "Madrid_Collector"
    },
    {
      id: 6,
      playerName: "Erling Haaland",
      teamName: "Manchester City",
      cardType: "Insert Hot Rookies",
      price: "95€",
      imageUrl: null,
      seller: "City_Fan2023"
    }
  ];

  // Filtrer les cartes à la vente selon la recherche
  const filteredCardsForSale = cardsForSale.filter(card =>
    card.playerName.toLowerCase().includes(forSaleSearchTerm.toLowerCase()) ||
    card.teamName.toLowerCase().includes(forSaleSearchTerm.toLowerCase()) ||
    card.cardType.toLowerCase().includes(forSaleSearchTerm.toLowerCase()) ||
    card.seller.toLowerCase().includes(forSaleSearchTerm.toLowerCase())
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
      
      <Header title="Communauté" />

      <main className="relative z-10 px-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-50 pb-4 mb-4 pt-2 -mx-4 px-4" style={{ height: '65px' }}>
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide min-h-[48px] items-center px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setActiveTab("featured")}
                className={`px-5 py-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === "featured" 
                    ? "bg-yellow-600 text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Star className="w-3 h-3 mr-1 inline" />
                À la une
              </button>
              <button
                onClick={() => setActiveTab("forsale")}
                className={`px-5 py-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === "forsale" 
                    ? "text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                style={activeTab === "forsale" ? { backgroundColor: '#F37261' } : {}}
              >
                <ShoppingBag className="w-3 h-3 mr-1 inline" />
                Sur le marché
              </button>
              <button
                onClick={() => setActiveTab("discover")}
                className={`px-5 py-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === "discover" 
                    ? "text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                style={activeTab === "discover" ? { backgroundColor: '#F37261' } : {}}
              >
                <Globe className="w-3 h-3 mr-1 inline" />
                Découvrir
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-5 py-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === "profile" 
                    ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Users className="w-3 h-3 mr-1 inline" />
                Mon Profil
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-5 py-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
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

          <TabsContent value="featured" className="space-y-4">
            {/* À la une - Empty state */}
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-24 h-24 bg-yellow-600/20 rounded-full flex items-center justify-center mb-6">
                <Star className="w-12 h-12 text-yellow-600" />
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
          </TabsContent>

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
              ) : (
                <>
                  {/* Max la menace profile */}
                  <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          M
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Max la menace</h3>
                          <p className="text-sm text-gray-400">@maxlamenace</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setLocation('/chat/999')}
                          variant="outline"
                          size="sm"
                          className="border-gray-400 text-gray-400 hover:bg-gray-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
                        >
                          Suivre
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-3">
                      Collectionneur passionné
                    </div>
                    
                    <div className="flex space-x-4 text-xs text-gray-400">
                      <span>0 collections</span>
                      <span>0 cartes</span>
                      <span>0 abonnés</span>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Aucun autre collectionneur pour le moment</p>
                  </div>
                </>
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
                      {activity.user?.avatar ? (
                        <img src={activity.user.avatar} alt={activity.user?.name || 'User'} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (activity.user?.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActivityIcon(activity.type)}
                        <span className="font-semibold text-white">{activity.user?.name || 'Utilisateur'}</span>
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
            {/* Barre de recherche pour cartes à la vente */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher des cartes..."
                value={forSaleSearchTerm}
                onChange={(e) => setForSaleSearchTerm(e.target.value)}
                className="pl-10 bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-white placeholder:text-gray-400"
              />
            </div>
            
            {/* Cards for sale with search functionality */}
            <div className="grid grid-cols-2 gap-4">
              {filteredCardsForSale.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <div className="text-gray-400">
                    {forSaleSearchTerm ? "Aucune carte trouvée" : "Aucune carte en vente"}
                  </div>
                </div>
              ) : (
                filteredCardsForSale.map((card) => (
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
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {/* Mon Profil - Post Creation Trigger */}
            <div 
              className="bg-[hsl(214,35%,22%)] rounded-lg p-4 mb-4 cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors w-full"
              onClick={handleOpenPostModal}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="w-full bg-[hsl(214,35%,18%)] border border-[hsl(214,35%,30%)] rounded-lg px-3 py-3 text-gray-400 pointer-events-none">
                    Quoi de neuf ?
                  </div>
                </div>
              </div>
            </div>

            {/* Activities Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Mes Activités</h3>
                <div className="text-sm text-gray-400">
                  {userActivities.length} activités
                </div>
              </div>

              {userActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">Aucune activité récente</p>
                  <p className="text-sm text-gray-500">
                    Tes actions de vente et échange apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userActivities.map((activity) => (
                    <div key={activity.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center flex-shrink-0">
                          {activity.type === 'marked_for_sale' && <Star className="w-4 h-4 text-white" />}
                          {activity.type === 'marked_for_trade' && <Users className="w-4 h-4 text-white" />}
                          {activity.type === 'added_card' && <Plus className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-white font-medium text-sm">
                              {activity.user.name || activity.user.username}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {formatTimeAgo(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            {(() => {
                              switch (activity.type) {
                                case "marked_for_sale":
                                  return `a mis ${activity.card?.playerName} en vente`;
                                case "added_card":
                                  return `a ajouté ${activity.card?.playerName} à sa collection`;
                                case "marked_for_trade":
                                  return `propose ${activity.card?.playerName} en échange`;
                                case "completed_collection":
                                  return `a complété la collection ${activity.collection?.name}`;
                                default:
                                  return "activité inconnue";
                              }
                            })()}
                          </p>
                          {activity.card && (
                            <div className="mt-2 text-xs text-[hsl(9,85%,67%)]">
                              Carte: {activity.card.playerName} - {activity.card.teamName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {userActivities.length > 5 && (
                    <button className="w-full text-center py-3 text-sm text-gray-400 hover:text-white transition-colors">
                      Voir plus d'activités
                    </button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* Page de création de publication */}
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

            {/* Zone de texte avec bordure */}
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
              <div className="relative mb-4">
                <img
                  src={URL.createObjectURL(selectedPhoto)}
                  alt="Photo sélectionnée"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}

            {/* Tagged people */}
            {taggedPeople.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Personnes identifiées :</div>
                <div className="flex flex-wrap gap-2">
                  {taggedPeople.map((person) => (
                    <div key={person} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      {person}
                      <button onClick={() => removeTaggedPerson(person)} className="ml-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boutons d'options */}
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
              <button 
                onClick={() => setSearchPeople(searchPeople ? "" : " ")}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-sm">Identifier des personnes</span>
              </button>
            </div>

            {/* Search people input - positioned to avoid button overlap */}
            {searchPeople && (
              <div className={`mb-4 ${searchPeople ? 'pb-20' : ''}`}>
                <div className="relative">
                  <Input
                    placeholder="Rechercher une personne..."
                    value={searchPeople}
                    onChange={(e) => setSearchPeople(e.target.value)}
                    className="bg-[hsl(214,35%,18%)] border-gray-600 text-white text-sm"
                    autoFocus
                    onBlur={(e) => {
                      // Keep the input open if clicking on autocomplete results
                      if (!e.relatedTarget?.closest('.autocomplete-results')) {
                        setTimeout(() => setSearchPeople(""), 150);
                      }
                    }}
                  />
                  {filteredUsersForTags.length > 0 && (
                    <div className="autocomplete-results absolute top-full left-0 right-0 bg-[hsl(214,35%,18%)] border border-gray-600 rounded-lg mt-1 max-h-32 overflow-y-auto z-10">
                      {filteredUsersForTags.slice(0, 5).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addTaggedPerson(user.username)}
                          className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[hsl(214,35%,25%)] transition-colors"
                        >
                          {user.name} (@{user.username})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Boutons Annuler et Publier */}
            <div className="flex justify-between gap-3 fixed bottom-6 left-4 right-4">
              <Button
                onClick={() => {
                  setIsPostModalOpen(false);
                  setSearchPeople("");
                  setNewPostContent("");
                  setSelectedPhoto(null);
                  setTaggedPeople([]);
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