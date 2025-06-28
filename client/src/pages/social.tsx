import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, UserPlus, UserCheck, Bell, Star, TrendingUp, Search, Eye, MessageCircle, Activity, ShoppingBag, ArrowLeftRight, Plus, Globe, Heart, MoreHorizontal, Trash2, Grid, List, Filter, PenTool, MoreVertical, UserX, MessageSquare, X, DollarSign, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import NotificationsModal from "@/components/NotificationsModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, Collection, Card, Post } from "@shared/schema";
import CardDisplay from "@/components/card-display";

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
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [profileSearchTerm, setProfileSearchTerm] = useState("");
  const [saleFilter, setSaleFilter] = useState<"all" | "available" | "sold">("all");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});
  const [followingStatus, setFollowingStatus] = useState<Record<number, boolean>>({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Comments state
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
  const [postCommentsCount, setPostCommentsCount] = useState<Record<number, number>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMarketplaceCard, setSelectedMarketplaceCard] = useState<any>(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);

  // Get current user ID from authentication
  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  


  const currentUserId = currentUser?.user?.id?.toString() || "1";
  const userId = "999"; // Pour les profils consultés (maxlamenace)

  // Profile data queries
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}`],
  });

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: [`/api/users/${userId}/collections`],
  });

  const { data: marketplaceCards = [] } = useQuery<Card[]>({
    queryKey: [`/api/cards/marketplace`],
  });

  const { data: featuredCards = [] } = useQuery<Card[]>({
    queryKey: [`/api/users/${userId}/featured`],
  });

  // Feed query (posts from followed users)
  const { data: feed = [], isLoading: feedLoading } = useQuery<Post[]>({
    queryKey: ["/api/users/feed"],
  });

  // My posts query - utilise l'ID de l'utilisateur connecté
  const { data: myPosts = [], isLoading: myPostsLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${currentUserId}/posts`],
  });

  // Charger les likes de l'utilisateur au démarrage
  const { data: userLikes = [], isLoading: likesLoading } = useQuery<number[]>({
    queryKey: ['/api/posts/likes'],
    enabled: !!currentUser?.user?.id,
    staleTime: 30000, // Cache for 30 seconds to avoid refetching
  });

  // Mettre à jour les likes quand les données arrivent - uniquement quand les données sont chargées
  useEffect(() => {
    if (!likesLoading && userLikes !== undefined) {
      setLikedPosts(new Set(userLikes));
    }
  }, [userLikes, likesLoading]);

  // Initialiser les likes et commentaires des posts avec les vraies données
  useEffect(() => {
    const allPosts = [...(feed || []), ...(myPosts || [])];
    if (allPosts.length > 0) {
      const likes: Record<number, number> = {};
      const comments: Record<number, number> = {};
      allPosts.forEach(post => {
        // Always use server data for initial load, but preserve user interactions
        const serverLikeCount = post.likesCount || 0;
        const serverCommentCount = post.commentsCount || 0;
        
        // Only initialize if we don't have data yet
        if (postLikes[post.id] === undefined) {
          likes[post.id] = serverLikeCount;
        }
        if (postCommentsCount[post.id] === undefined) {
          comments[post.id] = serverCommentCount;
        }
      });
      
      // Only update if we have new data to set
      if (Object.keys(likes).length > 0) {
        setPostLikes(prev => ({ ...prev, ...likes }));
      }
      if (Object.keys(comments).length > 0) {
        setPostCommentsCount(prev => ({ ...prev, ...comments }));
      }
    }
  }, [feed, myPosts]); // Only depend on feed and myPosts arrays directly

  // Récupérer les utilisateurs pour découverte (limité à 10)
  const { data: users = [], isLoading: usersLoading } = useQuery<SocialUser[]>({
    queryKey: ["/api/social/users", { limit: 10 }],
  });

  // Recherche d'utilisateurs avec debounce
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SocialUser[]>({
    queryKey: ["/api/social/users", { search: searchTerm, limit: 50 }],
    enabled: searchTerm.length > 1, // Start searching after 2 characters
    staleTime: 5000, // Cache results for 5 seconds
  });

  // Récupérer les activités
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/social/activities"],
  });

  // Récupérer les notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<NotificationItem[]>({
    queryKey: ["/api/social/notifications"],
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
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
  const handleLike = async (postId: number) => {
    try {
      console.log('Attempting to like post:', postId);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('Token exists:', !!token);
      console.log('Token type:', localStorage.getItem('token') ? 'token' : 'authToken');
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Like result:', result);
      
      // Mettre à jour immédiatement l'interface
      if (result.liked) {
        setLikedPosts(prev => new Set([...Array.from(prev), postId]));
        console.log('Post liked successfully');
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        console.log('Post unliked successfully');
      }
      
      // Mettre à jour le compteur de likes
      setPostLikes(prev => ({ ...prev, [postId]: result.likesCount }));
      console.log(`Updated likes count for post ${postId}: ${result.likesCount}`);
      
      // Invalider le cache pour assurer la persistance
      queryClient.invalidateQueries({ queryKey: ['/api/posts/likes'] });
    } catch (error) {
      console.error('Erreur complète:', error);
    }
  };

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
    mutationFn: async (postData: { content: string; type: string; imageUrl?: string }) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir les données depuis la base
      queryClient.invalidateQueries({ queryKey: ["/api/users/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/activities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
      
      // Reset form
      setNewPostContent("");
      setSelectedPhoto(null);
      setTaggedPeople([]);
      setSearchPeople("");
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

  // Fonction pour créer un post
  const handleCreatePost = async () => {
    if (newPostContent.trim()) {
      let imageUrl: string | undefined = undefined;
      
      // Si une photo est sélectionnée, la convertir en base64
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
      setNewPostContent('');
      setSelectedPhoto(null);
      setTaggedPeople([]);
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

  // Fonctions pour le menu vertical
  const handleViewProfile = (userId: number) => {
    setLocation(`/profile/${userId}`);
  };

  const handleUserClick = (userId: number) => {
    setLocation(`/profile/${userId}`);
  };

  const handleFollowUser = (userId: number) => {
    // Logique pour suivre/ne plus suivre un utilisateur
    console.log(`Suivre utilisateur ${userId}`);
  };

  const handleContactUser = (userId: number) => {
    // Ouvrir une conversation avec l'utilisateur
    console.log(`Contacter utilisateur ${userId}`);
  };

  const handleBlockUser = (userId: number) => {
    // Bloquer l'utilisateur
    console.log(`Bloquer utilisateur ${userId}`);
  };

  // Filtrer les utilisateurs pour l'autocomplete des tags
  const filteredUsersForTags = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchPeople.toLowerCase()) ||
    (user.username || '').toLowerCase().includes(searchPeople.toLowerCase())
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

  // Handle add comment
  const handleAddComment = async (postId: number, content?: string) => {
    const commentContent = content || commentInputs[postId];
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
      
      // Mettre à jour les commentaires (ajout en tête pour ordre décroissant)
      setPostComments(prev => ({
        ...prev,
        [postId]: [{
          id: result.comment.id,
          content: result.comment.content,
          createdAt: result.comment.createdAt,
          user: {
            id: currentUser?.user?.id!,
            name: currentUser?.user?.name!,
            username: currentUser?.user?.username!,
            avatar: currentUser?.user?.avatar!
          }
        }, ...(prev[postId] || [])]
      }));

      // Mettre à jour le compteur
      setPostCommentsCount(prev => ({
        ...prev,
        [postId]: result.commentsCount
      }));

      // Invalider le cache pour forcer la mise à jour des données
      queryClient.invalidateQueries({ queryKey: ["/api/users/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/posts`] });

      // Vider l'input
      setCommentInputs(prev => ({
        ...prev,
        [postId]: ""
      }));
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  // Mutation pour suivre/arrêter de suivre un utilisateur
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: "follow" | "unfollow" }) => {
      if (action === "follow") {
        return apiRequest("POST", `/api/users/${userId}/follow`);
      } else {
        return apiRequest("DELETE", `/api/users/${userId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/feed"] });
      toast({
        title: "Succès",
        description: "Action effectuée avec succès",
        className: "bg-green-600 border-green-600 text-white",
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

  // Utiliser les résultats de recherche si on recherche, sinon les utilisateurs de découverte
  // Filtrer également côté client pour s'assurer que l'utilisateur actuel n'apparaît pas
  const displayedUsers = (searchTerm.length > 1 ? searchResults : users).filter(user => 
    user.id !== currentUser?.user?.id
  );

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show autocomplete when search term changes
  useEffect(() => {
    setShowAutocomplete(searchTerm.length > 0);
  }, [searchTerm]);

  // Filtrer les vraies cartes à la vente selon la recherche
  const filteredCardsForSale = marketplaceCards.filter(card =>
    card.playerName?.toLowerCase().includes(forSaleSearchTerm.toLowerCase()) ||
    card.teamName?.toLowerCase().includes(forSaleSearchTerm.toLowerCase()) ||
    card.cardType?.toLowerCase().includes(forSaleSearchTerm.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "added_card":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "marked_for_trade":
        return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
      case "marked_for_sale":
        return <ShoppingBag className="w-4 h-4 text-purple-500" />;
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
      case "marked_for_sale":
        return `a mis ${activity.card?.playerName} à la vente`;
      case "completed_collection":
        return `a complété la collection ${activity.collection?.name}`;
      default:
        return "activité inconnue";
    }
  };

  const formatTimeAgo = (dateString: string | Date) => {
    if (!dateString) return 'Date inconnue';
    
    let date: Date;
    
    // Handle French date format (DD/MM/YYYY HH:MM)
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split(' ');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        
        // Create ISO format string (YYYY-MM-DDTHH:MM)
        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
        date = new Date(isoString);
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Date invalide';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  // Composant pour le feed des utilisateurs suivis
  const FeedContent = () => {
    // Récupérer uniquement les posts du feed (pas les posts de l'utilisateur actuel)
    const { data: feedPosts = [] } = useQuery<any[]>({
      queryKey: [`/api/users/feed`],
    });

    const { data: activities = [] } = useQuery<Activity[]>({
      queryKey: [`/api/social/activities`],
    });

    // Filtrer les activités pour exclure celles de l'utilisateur actuel (userId = 1) et Max C (userId = 2)
    const filteredActivities = activities.filter(activity => activity.user.id !== 1 && activity.user.id !== 2);

    // Filtrer également les posts pour exclure ceux de l'utilisateur actuel (userId = 1) et Max C (userId = 2)  
    const filteredFeedPosts = feedPosts.filter(post => post.userId !== 1 && post.userId !== 2);

    // Combiner posts et activités filtrées et les trier par date décroissante
    const feedItems = [
      ...filteredFeedPosts.map(post => ({ ...post, itemType: 'post' })),
      ...filteredActivities.map(activity => ({ ...activity, itemType: 'activity' }))
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      return dateB.getTime() - dateA.getTime(); // Ordre décroissant (plus récent en premier)
    });



    if (feedItems.length === 0) {
      return (
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
      );
    }

    return (
      <div className="space-y-4">
        {feedItems.map((item) => (
          <div key={`${item.itemType}-${item.id}`}>
            {item.itemType === 'post' ? (
              // Affichage des posts
              <div className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {item.user?.avatar ? (
                          <img 
                            src={item.user.avatar} 
                            alt={`Avatar de ${item.user.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{item.user?.name?.charAt(0) || 'U'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleUserClick(item.user?.id || 0)}
                            className="text-white font-medium text-sm hover:text-[hsl(9,85%,67%)] transition-colors"
                          >
                            {item.user?.name}
                          </button>
                          <span className="text-xs text-gray-400">@{item.user?.username}</span>
                        </div>
                        <div className="text-xs text-gray-400">{formatPostDate(item.createdAt)}</div>
                      </div>
                    </div>
                    
                    {/* Menu vertical */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-600">
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleViewProfile(item.user?.id || 0)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleFollowUser(item.user?.id || 0)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Suivre
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleContactUser(item.user?.id || 0)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Contacter
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleBlockUser(item.user?.id || 0)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Bloquer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Post Content */}
                  {item.content && (
                    <div className="text-white text-sm mb-3 leading-relaxed mt-3">
                      {item.content}
                    </div>
                  )}
                  
                  {/* Post Image */}
                  {item.imageUrl && (
                    <div className="mt-3 mb-3">
                      <img 
                        src={item.imageUrl} 
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
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleLike(item.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            likedPosts.has(item.id) 
                              ? 'text-red-400' 
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${likedPosts.has(item.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs">{postLikes[item.id] || 0}</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">0</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Affichage des activités - même format que les posts
              <div className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {item.user?.avatar ? (
                          <img 
                            src={item.user.avatar} 
                            alt={`Avatar de ${item.user.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{item.user?.name?.charAt(0) || 'U'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleUserClick(item.user?.id || 0)}
                            className="text-white font-medium text-sm hover:text-[hsl(9,85%,67%)] transition-colors"
                          >
                            {item.user?.name}
                          </button>
                          <span className="text-xs text-gray-400">@{item.user?.username}</span>
                        </div>
                        <div className="text-xs text-gray-400">{formatPostDate(item.createdAt)}</div>
                      </div>
                    </div>
                    
                    {/* Menu vertical pour les activités */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-600">
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleViewProfile(item.user?.id || 0)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleFollowUser(item.user?.id || 0)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Suivre
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleContactUser(item.user?.id || 0)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Contacter
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleBlockUser(item.user?.id || 0)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Bloquer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Activity Content - Format similaire aux posts */}
                  <div className="text-white text-sm mb-3 leading-relaxed mt-3 flex items-center space-x-2">
                    {getActivityIcon(item.type)}
                    <span>{getActivityMessage(item)}</span>
                  </div>
                  
                  {/* Card info si présente */}
                  {item.card && (
                    <div className="flex items-center space-x-2 mt-2 p-2 bg-[hsl(214,35%,18%)] rounded">
                      {item.card.imageUrl && (
                        <img 
                          src={item.card.imageUrl} 
                          alt={item.card.playerName}
                          className="w-8 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="text-sm text-white">{item.card.playerName}</div>
                        <div className="text-xs text-gray-400">{item.card.teamName} • {item.card.reference}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Actions - même format que les posts */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">0</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">0</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white relative overflow-hidden">
      <HaloBlur />
      
      <Header title="Communauté" onNotificationClick={() => setIsNotificationsModalOpen(true)} />

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
                    ? "bg-purple-600 text-white shadow-lg transform scale-105" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
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
                <PenTool className="w-3 h-3 mr-1 inline" />
                Mes Posts
              </button>
            </div>
          </div>

          <TabsContent value="featured" className="space-y-4">
            {/* Feed des utilisateurs suivis */}
            {feedLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Chargement du feed...</div>
              </div>
            ) : feed.length > 0 ? (
              <div className="space-y-4">
                {feed.map((post) => (
                  <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg border border-[hsl(214,35%,30%)]">
                    {/* Post Header */}
                    <div className="p-4 border-b border-[hsl(214,35%,30%)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                            {post.user?.avatar ? (
                              <img 
                                src={post.user.avatar} 
                                alt={`Avatar de ${post.user.name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  {post.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setLocation(`/profile/${post.user?.id}`)}
                                className="text-white font-medium text-sm hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                {post.user?.name}
                              </button>
                              <button
                                onClick={() => setLocation(`/profile/${post.user?.id}`)}
                                className="text-xs text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                @{post.user?.username}
                              </button>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <p className="text-white text-sm mb-3">{post.content}</p>
                      
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
                          {postLikes[post.id] || 0} j'aime
                        </span>
                        <span className="text-gray-400 cursor-pointer hover:text-blue-400 transition-colors" onClick={async () => {
                          const newShowComments = new Set(showComments);
                          if (newShowComments.has(post.id)) {
                            newShowComments.delete(post.id);
                          } else {
                            newShowComments.add(post.id);
                            // Charger les commentaires si pas encore chargés
                            if (!postComments[post.id]) {
                              try {
                                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                                const response = await fetch(`/api/posts/${post.id}/comments`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  },
                                });
                                if (response.ok) {
                                  const comments = await response.json();
                                  setPostComments(prev => ({
                                    ...prev,
                                    [post.id]: comments || []
                                  }));
                                }
                              } catch (error) {
                                console.error('Erreur lors du chargement des commentaires:', error);
                              }
                            }
                          }
                          setShowComments(newShowComments);
                        }}>
                          {postCommentsCount[post.id] || 0} commentaire{(postCommentsCount[post.id] || 0) !== 1 ? 's' : ''}
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
                          onClick={() => {
                            const newShowComments = new Set(showComments);
                            if (newShowComments.has(post.id)) {
                              newShowComments.delete(post.id);
                            } else {
                              newShowComments.add(post.id);
                              // Ne pas charger les commentaires automatiquement, juste ouvrir le panneau
                            }
                            setShowComments(newShowComments);
                          }}
                          className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">Commenter</span>
                        </button>

                      </div>

                      {/* Comments Section */}
                      {showComments.has(post.id) && (
                        <div className="mt-4 pt-4 border-t border-[hsl(214,35%,30%)]">
                          {/* Add Comment Input */}
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

                          {/* Comments List - Only show if comments are loaded */}
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
                                          {formatTimeAgo(comment.createdAt)}
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
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">Votre feed est vide</div>
                <p className="text-sm text-gray-500">Suivez d'autres collectionneurs pour voir leurs posts et activités ici</p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="mt-4 bg-[#F37261] hover:bg-[#e5624f] text-white"
                >
                  Découvrir des collectionneurs
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-4">
            {/* Barre de recherche avec autocomplete */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher des collectionneurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowAutocomplete(searchTerm.length > 0)}
                className="pl-10 bg-[hsl(214,35%,22%)] border-[hsl(214,35%,30%)] text-white placeholder:text-gray-400"
                autoComplete="off"
              />
              
              {/* Autocomplete dropdown */}
              {showAutocomplete && searchTerm.length > 0 && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-[hsl(214,35%,18%)] border border-[hsl(214,35%,30%)] rounded-lg mt-1 max-h-64 overflow-y-auto z-20 shadow-xl">
                  {searchResults.slice(0, 8).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSearchTerm(user.username);
                        setShowAutocomplete(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[hsl(214,35%,25%)] transition-colors border-b border-[hsl(214,35%,30%)] last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={`Avatar de ${user.name || user.username}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                              {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium text-sm truncate">
                              {user.name || user.username}
                            </span>
                            <span className="text-gray-400 text-xs">@{user.username}</span>
                          </div>
                          {user.email && (
                            <div className="text-gray-500 text-xs truncate">{user.email}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.followersCount || 0} abonnés
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {searchResults.length > 8 && (
                    <div className="px-4 py-2 text-center text-gray-400 text-xs bg-[hsl(214,35%,15%)]">
                      +{searchResults.length - 8} autres résultats
                    </div>
                  )}
                </div>
              )}
              
              {/* No results message */}
              {showAutocomplete && searchTerm.length > 0 && !searchLoading && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-[hsl(214,35%,18%)] border border-[hsl(214,35%,30%)] rounded-lg mt-1 px-4 py-3 z-20 shadow-xl">
                  <div className="text-gray-400 text-sm text-center">
                    Aucun utilisateur trouvé pour "{searchTerm}"
                  </div>
                </div>
              )}
            </div>

            {/* Liste des utilisateurs */}
            <div className="space-y-3">
              {(usersLoading || searchLoading) ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Chargement...</div>
                </div>
              ) : displayedUsers.length > 0 ? (
                displayedUsers.map((user) => (
                  <div key={user.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4 border border-[hsl(214,35%,30%)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={`Avatar de ${user.name || user.username}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <button 
                            onClick={() => handleUserClick(user.id)}
                            className="font-semibold text-white hover:text-[hsl(9,85%,67%)] transition-colors text-left"
                          >
                            {user.name || user.username}
                          </button>
                          <p className="text-sm text-gray-400">@{user.username}</p>
                          {searchTerm && user.email && (
                            <p className="text-xs text-gray-500">{user.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setLocation(`/chat/${user.id}`)}
                          variant="outline"
                          size="sm"
                          className="border-gray-400 text-gray-400 hover:bg-gray-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => followMutation.mutate({ userId: user.id, action: user.isFollowing ? "unfollow" : "follow" })}
                          disabled={followMutation.isPending}
                          size="sm"
                          className={`${
                            user.isFollowing 
                              ? "bg-gray-600 hover:bg-gray-700 text-white"
                              : "bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white"
                          }`}
                        >
                          {user.isFollowing ? "Suivi" : "Suivre"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-3">
                      {user.bio || "Collectionneur passionné"}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{user.followersCount || 0} abonnés</span>
                      <span>{user.collectionsCount || 0} decks</span>
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
            
            {/* Cards for sale - 2 per line on mobile, more on larger screens */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredCardsForSale.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400">
                    {forSaleSearchTerm ? "Aucune carte trouvée" : "Aucune carte en vente"}
                  </div>
                </div>
              ) : (
                filteredCardsForSale.map((card) => (
                  <div 
                    key={card.id} 
                    className="card-clickable bg-[hsl(214,35%,22%)] rounded-lg p-2 card-hover cursor-pointer group relative transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-[hsl(9,85%,67%)]/50"
                    onClick={() => setSelectedMarketplaceCard(card)}
                  >
                    {/* Badge "En vente" - plus petit */}
                    <div className="absolute top-1 right-1 bg-[hsl(9,85%,67%)] text-white px-1.5 py-0.5 rounded-full font-bold text-xs z-10 shadow-lg">
                      VENTE
                    </div>
                    
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 rounded-md mb-2 flex items-center justify-center overflow-hidden relative">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={card.playerName || 'Carte'} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="text-white text-center p-2">
                          <div className="text-xs font-bold mb-1 text-[hsl(9,85%,67%)]">{card.playerName}</div>
                          <div className="text-xs text-gray-300">{card.teamName}</div>
                        </div>
                      )}
                      
                      {/* Overlay with hover effect */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-xs truncate font-luckiest">{card.playerName}</h4>
                      <p className="text-gray-400 text-xs truncate font-poppins">{card.teamName}</p>
                      <div className="text-gray-500 text-xs">
                        <div>Score Ligue 1</div>
                        <div className="flex justify-between items-center">
                          <span>{card.season || '23/24'}</span>
                          <span className="text-[hsl(9,85%,67%)] font-bold">
                            {card.salePrice ? `${card.salePrice}€` : 'Négoc.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {userLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Chargement du profil...</div>
              </div>
            ) : (
              <>
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
                            {/* Post Header - Darker Background */}
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
                              {/* Post Text */}
                              {post.content && (
                                <div className="text-white text-sm mb-3 leading-relaxed">
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
                            </div>

                            {/* Post Actions */}
                            <div className="px-4 pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  {/* Likes */}
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => handleLike(post.id)}
                                      className={`flex items-center space-x-1 transition-colors ${
                                        likedPosts.has(post.id) 
                                          ? 'text-red-400' 
                                          : 'text-gray-400 hover:text-red-400'
                                      }`}
                                    >
                                      <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                      <span className="text-xs">{postLikes[post.id] || 0}</span>
                                    </button>
                                  </div>

                                  {/* Comments */}
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={async () => {
                                        const newShowComments = new Set(showComments);
                                        if (newShowComments.has(post.id)) {
                                          newShowComments.delete(post.id);
                                        } else {
                                          newShowComments.add(post.id);
                                          // Charger les commentaires si pas encore chargés
                                          if (!postComments[post.id]) {
                                            try {
                                              const response = await fetch(`/api/posts/${post.id}/comments`);
                                              if (response.ok) {
                                                const comments = await response.json();
                                                setPostComments(prev => ({
                                                  ...prev,
                                                  [post.id]: comments
                                                }));
                                              }
                                            } catch (error) {
                                              console.error('Erreur lors du chargement des commentaires:', error);
                                            }
                                          }
                                        }
                                        setShowComments(newShowComments);
                                      }}
                                      className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      <span className="text-xs">{postCommentsCount[post.id] || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[hsl(214,35%,30%)]">
                                <button 
                                  onClick={() => handleLike(post.id)}
                                  className={`flex items-center space-x-2 transition-colors text-xs ${
                                    likedPosts.has(post.id) 
                                      ? 'text-red-400' 
                                      : 'text-gray-400 hover:text-red-400'
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
              </>
            )}
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
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors"
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

      {/* Modal latéral pour les détails de carte du marché */}
      {selectedMarketplaceCard && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 z-50" 
            onClick={() => setSelectedMarketplaceCard(null)}
          />
          
          {/* Modal latéral qui glisse depuis la droite */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[hsl(214,35%,18%)] z-[60] transform transition-transform duration-300 ease-out overflow-y-auto">
            <div className="p-6">
              {/* Header du modal */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Détails de la carte</h2>
                <div className="flex items-center gap-2">
                  {/* Menu actions */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      className="text-gray-400 hover:text-white transition-colors p-1"
                      onClick={() => setShowDropdownMenu(!showDropdownMenu)}
                    >
                      <MoreVertical className="w-6 h-6" />
                    </button>
                    
                    {showDropdownMenu && (
                      <div className="absolute right-0 top-8 min-w-[12rem] bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50">
                        <div 
                          className="text-white hover:bg-gray-700 cursor-pointer px-3 py-2 flex items-center"
                          onClick={() => {
                            setShowDropdownMenu(false);
                            setSelectedMarketplaceCard(null);
                            toast({
                              title: "Fonctionnalité à venir",
                              description: "La messagerie pour contacter les vendeurs sera bientôt disponible",
                              className: "bg-blue-600 border-blue-600 text-white",
                            });
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contacter le vendeur
                        </div>
                        <div 
                          className="text-white hover:bg-gray-700 cursor-pointer px-3 py-2 flex items-center"
                          onClick={() => {
                            setShowDropdownMenu(false);
                            setSelectedMarketplaceCard(null);
                            setLocation(`/profile/${selectedMarketplaceCard.userId}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir le profil
                        </div>
                        <div 
                          className="text-white hover:bg-gray-700 cursor-pointer px-3 py-2 flex items-center"
                          onClick={() => {
                            setShowDropdownMenu(false);
                            navigator.share?.({
                              title: `Carte ${selectedMarketplaceCard.playerName}`,
                              text: `Découvrez cette carte ${selectedMarketplaceCard.playerName} en vente`,
                              url: window.location.href
                            }).catch(() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast({
                                title: "Lien copié",
                                description: "Le lien de la carte a été copié dans le presse-papiers",
                                className: "bg-green-600 border-green-600 text-white",
                              });
                            });
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Partager
                        </div>
                        <div 
                          className="text-red-400 hover:bg-red-600/10 cursor-pointer px-3 py-2 flex items-center"
                          onClick={() => {
                            setShowDropdownMenu(false);
                            toast({
                              title: "Signalement envoyé",
                              description: "Cette carte a été signalée à l'équipe de modération",
                              className: "bg-red-600 border-red-600 text-white",
                            });
                            setSelectedMarketplaceCard(null);
                          }}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Signaler
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Bouton fermer */}
                  <button
                    onClick={() => setSelectedMarketplaceCard(null)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Image de la carte */}
              <div className="aspect-[3/4] bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl overflow-hidden mb-6 relative">
                {selectedMarketplaceCard.imageUrl ? (
                  <img 
                    src={selectedMarketplaceCard.imageUrl} 
                    alt={selectedMarketplaceCard.playerName || 'Carte'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center p-4">
                      <div className="text-lg font-bold mb-2">{selectedMarketplaceCard.playerName}</div>
                      <div className="text-sm text-gray-300">{selectedMarketplaceCard.teamName}</div>
                      <div className="text-xs text-gray-400 mt-1">{selectedMarketplaceCard.cardType}</div>
                    </div>
                  </div>
                )}
                
                {/* Badge "En vente" */}
                <div className="absolute top-4 right-4 bg-[hsl(9,85%,67%)] text-white px-3 py-2 rounded-full text-sm font-bold">
                  EN VENTE
                </div>
              </div>

              {/* Informations de la carte */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedMarketplaceCard.playerName}</h3>
                  <p className="text-gray-400 text-lg mb-1">{selectedMarketplaceCard.teamName}</p>
                  <p className="text-gray-500">{selectedMarketplaceCard.cardType}</p>
                </div>

                {/* Vendeur */}
                <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
                  <div className="text-white font-medium text-sm mb-2">Vendeur</div>
                  <button
                    onClick={() => setLocation(`/profile/${selectedMarketplaceCard.userId}`)}
                    className="font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-white underline hover:text-[hsl(9,85%,67%)]">
                      {selectedMarketplaceCard.sellerName || selectedMarketplaceCard.userName || 'Max la menace'}
                    </span>
                    <span className="text-gray-400 italic">
                      @{selectedMarketplaceCard.sellerUsername || selectedMarketplaceCard.username || 'maxlamenace'}
                    </span>
                  </button>
                </div>

                {/* Prix de vente */}
                <div className="bg-green-600/10 rounded-lg p-4 border border-green-600/20">
                  <div className="text-green-400 font-medium text-sm mb-1">Prix de vente</div>
                  <div className="text-green-400 font-bold text-2xl">
                    {selectedMarketplaceCard.salePrice ? `${selectedMarketplaceCard.salePrice}€` : 'Prix à négocier'}
                  </div>
                </div>

                {/* Description de vente */}
                {selectedMarketplaceCard.saleDescription && selectedMarketplaceCard.saleDescription.trim() !== '' && (
                  <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
                    <div className="text-white font-medium text-sm mb-2">Description</div>
                    <div className="text-gray-300 text-sm leading-relaxed">
                      {selectedMarketplaceCard.saleDescription}
                    </div>
                  </div>
                )}

                {/* Informations techniques */}
                <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4">
                  <div className="text-white font-medium text-sm mb-3">Informations</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Collection:</span>
                      <span className="text-white">Score Ligue 1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Saison:</span>
                      <span className="text-white">{selectedMarketplaceCard.season || '23/24'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type de carte:</span>
                      <span className="text-white">{selectedMarketplaceCard.cardType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Équipe:</span>
                      <span className="text-white">{selectedMarketplaceCard.teamName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Joueur:</span>
                      <span className="text-white">{selectedMarketplaceCard.playerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">État:</span>
                      <span className="text-green-400">Near Mint</span>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </>
      )}

      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      <Navigation />
    </div>
  );
}