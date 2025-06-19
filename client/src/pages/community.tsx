import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { Users, MessageCircle, Trophy, Star } from "lucide-react";

export default function Community() {
  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20">
      <Header title="Communauté" />
      
      <div className="p-4 space-y-6">
        {/* Stats de la communauté */}
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

        {/* Forums */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Forums</h2>
          
          <div className="space-y-3">
            {[
              { title: "Échanges & Ventes", count: "42 messages", lastPost: "Il y a 2h" },
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

        {/* Top Collectionneurs */}
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
        </div>

        {/* Activité récente */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Activité Récente</h2>
          
          <div className="space-y-3">
            {[
              { user: "Marc D.", action: "a ajouté", item: "Mbappé RC", time: "Il y a 15min" },
              { user: "Julie K.", action: "recherche", item: "Hakimi Insert", time: "Il y a 30min" },
              { user: "Pierre M.", action: "a complété", item: "Collection PSG", time: "Il y a 1h" }
            ].map((activity, index) => (
              <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-[hsl(9,85%,67%)]" />
                    <span className="font-poppins">
                      <span className="font-bold">{activity.user}</span>
                      <span className="text-[hsl(212,23%,69%)]"> {activity.action} </span>
                      <span className="text-[hsl(9,85%,67%)]">{activity.item}</span>
                    </span>
                  </div>
                  <div className="text-xs text-[hsl(212,23%,69%)]">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}