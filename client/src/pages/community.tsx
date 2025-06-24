import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { Users, MessageCircle, Trophy, Star, Activity, Hash } from "lucide-react";

export default function Community() {
  const [activeTab, setActiveTab] = useState<"feed" | "forums" | "leaderboard">("feed");
  const [, setLocation] = useLocation();

  const handleUserClick = (userId: number) => {
    setLocation(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20">
      <Header title="Communauté" />
      
      <div className="p-4 space-y-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-[hsl(214,35%,22%)] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "feed"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" />
            Mon Feed
          </button>
          <button
            onClick={() => setActiveTab("forums")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "forums"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Hash className="w-4 h-4" />
            Forums
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "leaderboard"
                ? "bg-[hsl(9,85%,67%)] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Classement
          </button>
        </div>

        {/* Dynamic Bullets */}
        <div className="grid grid-cols-4 gap-2 mb-6">
{activeTab === 'feed' && [
            { label: "Posts du jour", value: "23", color: "bg-purple-500" },
            { label: "Nouvelles cartes", value: "156", color: "bg-orange-500" },
            { label: "Échanges actifs", value: "12", color: "bg-blue-500" },
            { label: "Membres en ligne", value: "48", color: "bg-green-500" }
          ].map((bullet, index) => (
            <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
              <div className={`w-2 h-2 rounded-full ${bullet.color} mx-auto mb-2`}></div>
              <div className="text-white font-bold text-lg">{bullet.value}</div>
              <div className="text-gray-400 text-xs">{bullet.label}</div>
            </div>
          ))}
          
          {activeTab === 'forums' && [
            { label: "Messages du jour", value: "142", color: "bg-blue-500" },
            { label: "Sujets actifs", value: "18", color: "bg-purple-500" },
            { label: "Nouveaux membres", value: "7", color: "bg-green-500" },
            { label: "Réponses", value: "89", color: "bg-orange-500" }
          ].map((bullet, index) => (
            <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
              <div className={`w-2 h-2 rounded-full ${bullet.color} mx-auto mb-2`}></div>
              <div className="text-white font-bold text-lg">{bullet.value}</div>
              <div className="text-gray-400 text-xs">{bullet.label}</div>
            </div>
          ))}
          
          {activeTab === 'leaderboard' && [
            { label: "Top collecteurs", value: "50", color: "bg-yellow-500" },
            { label: "Cartes totales", value: "12.5k", color: "bg-blue-500" },
            { label: "Collections", value: "247", color: "bg-purple-500" },
            { label: "Échanges", value: "1.2k", color: "bg-green-500" }
          ].map((bullet, index) => (
            <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-3 text-center">
              <div className={`w-2 h-2 rounded-full ${bullet.color} mx-auto mb-2`}></div>
              <div className="text-white font-bold text-lg">{bullet.value}</div>
              <div className="text-gray-400 text-xs">{bullet.label}</div>
            </div>
          ))}
        </div>

        {/* Mon Feed Tab */}
        {activeTab === "feed" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-luckiest">Mon Feed</h2>
            
            <div className="space-y-3">
              {[
                { 
                  userId: 1,
                  user: "Alexandre M.", 
                  action: "a ajouté une nouvelle carte",
                  card: "Kylian Mbappé Rookie",
                  time: "Il y a 2h",
                  type: "add"
                },
                { 
                  userId: 2,
                  user: "Sophie L.", 
                  action: "a mis sur le marché",
                  card: "Lionel Messi Parallel",
                  time: "Il y a 4h",
                  type: "sale"
                },
                { 
                  userId: 3,
                  user: "Thomas R.", 
                  action: "a complété la collection",
                  card: "SCORE Ligue 1 2024",
                  time: "Il y a 6h",
                  type: "complete"
                },
                { 
                  userId: 4,
                  user: "Marie C.", 
                  action: "cherche à échanger",
                  card: "Neymar Insert Gold",
                  time: "Il y a 1j",
                  type: "trade"
                }
              ].map((activity, index) => (
                <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[hsl(9,85%,67%)] to-[hsl(9,85%,50%)] rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {activity.user.split(' ')[0][0]}{activity.user.split(' ')[1][0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <button 
                          onClick={() => handleUserClick(activity.userId)}
                          className="font-bold font-poppins text-white hover:text-[hsl(9,85%,67%)] transition-colors"
                        >
                          {activity.user}
                        </button>
                        <span className="text-gray-300"> {activity.action} </span>
                        <span className="font-semibold text-[hsl(9,85%,67%)]">{activity.card}</span>
                      </div>
                      <div className="text-xs text-[hsl(212,23%,69%)] mt-1">{activity.time}</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'add' ? 'bg-green-500' :
                      activity.type === 'sale' ? 'bg-blue-500' :
                      activity.type === 'complete' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forums Tab */}
        {activeTab === "forums" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <div>
                    <div className="font-bold text-lg">2,847</div>
                    <div className="text-sm text-[hsl(212,23%,69%)]">Collectionneurs</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <div>
                    <div className="font-bold text-lg">156</div>
                    <div className="text-sm text-[hsl(212,23%,69%)]">Messages</div>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold font-luckiest">Forums</h2>
            
            <div className="space-y-3">
              {[
                { title: "Échanges & Sur le marché", count: "42 messages", lastPost: "Il y a 2h" },
                { title: "Nouveautés Panini", count: "28 messages", lastPost: "Il y a 5h" },
                { title: "Collections Complètes", count: "15 messages", lastPost: "Il y a 1j" },
                { title: "Rookie Cards", count: "67 messages", lastPost: "Il y a 3h" }
              ].map((forum, index) => (
                <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold font-poppins">{forum.title}</h3>
                      <p className="text-sm text-[hsl(212,23%,69%)]">{forum.count}</p>
                    </div>
                    <div className="text-xs text-[hsl(212,23%,69%)]">{forum.lastPost}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-luckiest">Top Collectionneurs</h2>
            
            <div className="space-y-3">
              {[
                { name: "Alexandre M.", cards: 1247, rank: 1 },
                { name: "Sophie L.", cards: 1156, rank: 2 },
                { name: "Thomas R.", cards: 1089, rank: 3 },
                { name: "Marie C.", cards: 967, rank: 4 }
              ].map((collector, index) => (
                <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        collector.rank === 1 ? 'bg-yellow-500' : 
                        collector.rank === 2 ? 'bg-gray-400' :
                        collector.rank === 3 ? 'bg-orange-600' : 'bg-[hsl(9,85%,67%)]'
                      }`}>
                        <span className="text-sm font-bold text-white">{collector.rank}</span>
                      </div>
                      <div>
                        <div className="font-bold font-poppins">{collector.name}</div>
                        <div className="text-sm text-[hsl(212,23%,69%)]">{collector.cards} cartes</div>
                      </div>
                    </div>
                    {collector.rank <= 3 && (
                      <Trophy className={`w-5 h-5 ${
                        collector.rank === 1 ? 'text-yellow-500' : 
                        collector.rank === 2 ? 'text-gray-400' :
                        'text-orange-600'
                      }`} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold font-luckiest">Activité Récente</h2>
              
              <div className="space-y-3">
                {[
                  { user: "Thomas R.", action: "nouvelle carte ajoutée", card: "Kylian Mbappé Rookie", time: "Il y a 30min" },
                  { user: "Sophie L.", action: "échange proposé", card: "Lionel Messi Parallel", time: "Il y a 1h" },
                  { user: "Alexandre M.", action: "collection complétée", card: "SCORE Ligue 1 2024", time: "Il y a 2h" },
                  { user: "Marie C.", action: "carte mise sur le marché", card: "Neymar Insert Gold", time: "Il y a 3h" }
                ].map((activity, index) => (
                  <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold font-poppins">{activity.user}</span>
                        <span className="text-gray-300"> - {activity.action}</span>
                        <div className="text-sm text-[hsl(9,85%,67%)] mt-1">{activity.card}</div>
                      </div>
                      <div className="text-xs text-[hsl(212,23%,69%)]">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}