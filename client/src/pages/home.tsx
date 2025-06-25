import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users, Star, TrendingUp, BookOpen, ArrowRight, Zap, Trophy, Gift, Heart, Camera, Package } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import type { User, Collection } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/users/1/collections"],
    staleTime: 10 * 60 * 1000,
  });

  const { data: personalCards = [], isLoading: personalCardsLoading } = useQuery<any[]>({
    queryKey: ["/api/personal-cards"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: socialUsers = [], isLoading: socialUsersLoading } = useQuery<any[]>({
    queryKey: ["/api/social/users"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/social/activities"],
    staleTime: 2 * 60 * 1000,
  });

  const recentActivities = activities.slice(0, 3);
  const suggestedUsers = socialUsers.slice(0, 3);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white">
      <HaloBlur />
      <Header title="Accueil" />
      
      <div className="flex-1 pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[hsl(9,85%,67%)] to-orange-500 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="relative z-10">
              <h1 className="text-2xl font-bold font-luckiest mb-2">
                Salut {user?.name || user?.username} ! 👋
              </h1>
              <p className="text-white/90 mb-4">
                Prêt à agrandir ta collection aujourd'hui ?
              </p>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Trophy className="w-4 h-4" />
                <span>{collections?.length || 0} deck(s)</span>
                <span>•</span>
                <span>{personalCards.length || 0} carte(s) personnelle(s)</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Create Collection */}
            <div 
              onClick={() => setLocation("/collections")}
              className="bg-[hsl(214,35%,22%)] rounded-xl p-6 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Créer votre première collection</h3>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  Organisez vos cartes par thème, équipe ou saison
                </p>
                <div className="flex items-center text-[hsl(9,85%,67%)] text-sm font-medium group-hover:text-[hsl(9,85%,60%)]">
                  Commencer <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Add Card */}
            <div 
              onClick={() => setLocation("/add-card")}
              className="bg-[hsl(214,35%,22%)] rounded-xl p-6 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Plus className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Ajouter une carte</h3>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Scannez ou ajoutez manuellement vos nouvelles cartes
              </p>
              <div className="flex items-center text-green-400 text-sm font-medium group-hover:text-green-300">
                Ajouter <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Discover Users */}
            <div 
              onClick={() => setLocation("/community")}
              className="bg-[hsl(214,35%,22%)] rounded-xl p-6 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Découvrir d'autres collectionneurs</h3>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Rejoignez la communauté et échangez vos cartes
              </p>
              <div className="flex items-center text-purple-400 text-sm font-medium group-hover:text-purple-300">
                Découvrir <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>

          {/* What's New Section */}
          <div className="bg-[hsl(214,35%,22%)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold font-luckiest text-white">Quoi de neuf ?</h2>
            </div>
            
            {activitiesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-[hsl(214,35%,18%)] rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      {activity.type === 'marked_for_sale' && <Gift className="w-4 h-4 text-white" />}
                      {activity.type === 'new_collection' && <BookOpen className="w-4 h-4 text-white" />}
                      {activity.type === 'new_card' && <Plus className="w-4 h-4 text-white" />}
                      {activity.type === 'trade_completed' && <Heart className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="font-medium">{activity.userName}</span> {activity.description}
                      </p>
                      <p className="text-gray-400 text-xs">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune activité récente</p>
                <p className="text-sm">Commencez à créer votre collection !</p>
              </div>
            )}
          </div>

          {/* Suggested Users */}
          {suggestedUsers.length > 0 && (
            <div className="bg-[hsl(214,35%,22%)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold font-luckiest text-white">Collectionneurs suggérés</h2>
                </div>
                <button 
                  onClick={() => setLocation("/community")}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Voir tous
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {suggestedUsers.map((user: any) => (
                  <div 
                    key={user.id}
                    onClick={() => setLocation(`/user/${user.id}`)}
                    className="bg-[hsl(214,35%,18%)] rounded-lg p-4 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{user.name || user.username}</h3>
                        <p className="text-gray-400 text-xs">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{user.followersCount || 0} abonnés</span>
                      <span>{user.collectionsCount || 0} collections</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      
      <Navigation />
    </div>
  );
}