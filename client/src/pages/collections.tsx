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
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 mb-6 gradient-overlay">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                alt="User avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-[hsl(9,85%,67%)]"
              />
              <div>
                <h2 className="text-xl font-bold text-white font-poppins">{user.name}</h2>
                <p className="text-[hsl(212,23%,69%)] text-sm font-poppins">@{user.username}</p>
              </div>
            </div>
            
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
              className="bg-[hsl(214,35%,22%)] rounded-xl p-4 card-hover cursor-pointer"
            >
              <div className="bg-[hsl(9,85%,67%)] rounded-lg p-3 mb-3 text-center">
                <h3 className="font-bold text-white text-sm font-luckiest">{collection.name}</h3>
                <p className="text-xs text-white opacity-90 font-poppins">{collection.season}</p>
              </div>
              <img 
                src={collection.imageUrl || ""} 
                alt={`${collection.name} cards`}
                className="w-full h-20 object-cover rounded-lg mb-2"
              />
              <div className="text-xs text-[hsl(212,23%,69%)]">{collection.totalCards} cartes</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                <div 
                  className="progress-bar h-1.5 rounded-full" 
                  style={{ width: `${collection.completionPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Collection Button */}
        <button className="w-full bg-[hsl(9,85%,67%)] text-white py-4 rounded-xl font-semibold mt-6 hover:bg-opacity-90 transition-all">
          <Plus className="w-5 h-5 inline mr-2" />
          Ajouter une collection
        </button>
      </main>

      <Navigation />
    </div>
  );
}
