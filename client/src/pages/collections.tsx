import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import type { User, Collection } from "@shared/schema";

export default function Collections() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/users/1/collections"],
  });

  const handleCollectionClick = (collectionId: number) => {
    setLocation(`/collection/${collectionId}`);
  };

  if (userLoading || collectionsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <Header title="Collections" />

      <main className="relative z-10 px-4 pb-24">
        {/* User Profile Section */}
        {user && (
          <div className="flex flex-col items-center text-center mb-8 mt-4">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <div className="w-20 h-20 bg-[#FF6B35] rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-luckiest tracking-wide">{user.name}</h2>
            <p className="text-[hsl(212,23%,69%)] text-sm font-poppins mb-4">@{user.username}</p>
            
            <div className="flex space-x-6 text-center">
              <div>
                <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{user.totalCards?.toLocaleString()}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Cartes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{user.collectionsCount}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Collections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">{user.completionPercentage}%</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Complété</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-6 mb-6 border-b border-[hsl(214,35%,22%)]">
          <button className="pb-2 text-[hsl(9,85%,67%)] border-b-2 border-[hsl(9,85%,67%)] font-medium">
            Toutes les cartes
          </button>
          <button className="pb-2 text-[hsl(212,23%,69%)]">Collections</button>
          <button className="pb-2 text-[hsl(212,23%,69%)]">Decks</button>
        </div>

        {/* Collections Grid */}
        <div className="collection-grid">
          {collections?.map((collection) => (
            <div 
              key={collection.id}
              onClick={() => handleCollectionClick(collection.id)}
              className="collection-card bg-[hsl(214,35%,22%)] rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transform transition-all duration-200 hover:shadow-xl group"
            >
              <div 
                className="h-32 relative bg-gradient-to-br"
                style={{ 
                  background: `linear-gradient(135deg, ${collection.backgroundColor || '#F37261'}, ${collection.backgroundColor || '#F37261'}dd)` 
                }}
              >
                <div className="absolute top-3 right-3 bg-black/20 text-white text-xs px-2 py-1 rounded-full">
                  {collection.completionPercentage}%
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <h3 className="font-bold text-white font-poppins">{collection.name}</h3>
                  <p className="text-white/80 text-sm">{collection.season}</p>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[hsl(212,23%,69%)]">
                    {collection.ownedCards} / {collection.totalCards} cartes
                  </span>
                </div>
                
                <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                  <div 
                    className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${collection.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Collection Button */}
          <div className="collection-card bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group">
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1 font-poppins">Nouvelle Collection</h3>
              <p className="text-[hsl(212,23%,69%)] text-sm">Ajouter une collection</p>
            </div>
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}