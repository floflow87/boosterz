import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Settings, 
  Plus, 
  UserPlus, 
  UserCheck, 
  UserX,
  Edit3,
  Send,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Post, Subscription } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"posts" | "following" | "followers" | "requests">("posts");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/users/1/posts"],
  });

  const { data: followers, isLoading: followersLoading } = useQuery<User[]>({
    queryKey: ["/api/users/1/followers"],
  });

  const { data: following, isLoading: followingLoading } = useQuery<User[]>({
    queryKey: ["/api/users/1/following"],
  });

  const { data: pendingRequests, isLoading: requestsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/users/1/subscription-requests"],
  });

  const createPostMutation = useMutation({
    mutationFn: (postData: { content: string; type: string }) =>
      apiRequest("POST", "/api/posts", postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/posts"] });
      setShowNewPost(false);
      setNewPostContent("");
      toast({
        title: "Post publié",
        description: "Votre post a été publié avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de publier le post.",
        variant: "destructive"
      });
    }
  });

  const handleSubscriptionRequest = useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: "accept" | "reject" }) =>
      apiRequest("PATCH", `/api/subscriptions/${requestId}`, { status: action === "accept" ? "accepted" : "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/subscription-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/followers"] });
      toast({
        title: "Demande traitée",
        description: "La demande d'abonnement a été traitée.",
        className: "bg-green-600 text-white border-green-700"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande.",
        variant: "destructive"
      });
    }
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    createPostMutation.mutate({
      content: newPostContent,
      type: "text"
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(9,85%,67%)] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20">
      <Header title="Mon Profil" />
      
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,50%)] rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.name?.split(' ')[0]?.[0]}{user?.name?.split(' ')[1]?.[0] || ''}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-luckiest text-white">{user?.name}</h1>
              <p className="text-[hsl(212,23%,69%)]">@{user?.username}</p>
              {user?.bio && (
                <p className="text-gray-300 mt-2">{user.bio}</p>
              )}
            </div>
            <button 
              onClick={() => setLocation("/settings")}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{user?.totalCards || 0}</div>
              <div className="text-sm text-[hsl(212,23%,69%)]">Cartes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{followers?.length || 0}</div>
              <div className="text-sm text-[hsl(212,23%,69%)]">Abonnés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{following?.length || 0}</div>
              <div className="text-sm text-[hsl(212,23%,69%)]">Abonnements</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[hsl(214,35%,22%)] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "posts"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "following"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Abonnements
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "followers"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Abonnés
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "requests"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            Demandes
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {/* New Post Button */}
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full bg-[hsl(214,35%,22%)] rounded-lg p-4 border-2 border-dashed border-gray-600 hover:border-[hsl(9,85%,67%)] transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 hover:text-white">
                <Plus className="w-5 h-5" />
                Créer un nouveau post
              </div>
            </button>

            {/* Posts List */}
            {posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,50%)] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user?.name?.split(' ')[0]?.[0]}{user?.name?.split(' ')[1]?.[0] || ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{user?.name}</span>
                          <span className="text-gray-400">@{user?.username}</span>
                          <span className="text-gray-500 text-sm">
                            {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-300 mt-2">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Edit3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucun post</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Partagez vos dernières trouvailles et vos cartes avec votre communauté.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Following Tab */}
        {activeTab === "following" && (
          <div className="space-y-4">
            {following && following.length > 0 ? (
              following.map((user) => (
                <div key={user.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,50%)] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user.name?.split(' ')[0]?.[0]}{user.name?.split(' ')[1]?.[0] || ''}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-gray-400">@{user.username}</div>
                        <div className="text-sm text-[hsl(212,23%,69%)]">{user.totalCards} cartes</div>
                      </div>
                    </div>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      Se désabonner
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucun abonnement</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed">
                  Découvrez d'autres collectionneurs dans la communauté.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Followers Tab */}
        {activeTab === "followers" && (
          <div className="space-y-4">
            {followers && followers.length > 0 ? (
              followers.map((user) => (
                <div key={user.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,50%)] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user.name?.split(' ')[0]?.[0]}{user.name?.split(' ')[1]?.[0] || ''}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-gray-400">@{user.username}</div>
                        <div className="text-sm text-[hsl(212,23%,69%)]">{user.totalCards} cartes</div>
                      </div>
                    </div>
                    <button className="bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      Voir profil
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucun abonné</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed">
                  Partagez votre profil pour attirer des abonnés.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {pendingRequests && pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,50%)] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">?</span>
                      </div>
                      <div>
                        <div className="font-bold text-white">Demande d'abonnement</div>
                        <div className="text-sm text-[hsl(212,23%,69%)]">
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSubscriptionRequest.mutate({ requestId: request.id, action: "accept" })}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                        disabled={handleSubscriptionRequest.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSubscriptionRequest.mutate({ requestId: request.id, action: "reject" })}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                        disabled={handleSubscriptionRequest.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune demande</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed">
                  Les demandes d'abonnement apparaîtront ici.
                </p>
              </div>
            )}
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Nouveau post</h3>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Partagez quelque chose avec votre communauté..."
                  className="w-full h-32 p-3 bg-[hsl(214,35%,15%)] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="flex-1 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || createPostMutation.isPending}
                    className="flex-1 p-3 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {createPostMutation.isPending ? "Publication..." : "Publier"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}