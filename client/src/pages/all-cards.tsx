import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grid, List, Plus, Camera, Search, Filter } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import type { User, Collection, Card } from "@shared/schema";

export default function AllCards() {
  const [viewMode, setViewMode] = useState<"grid" | "gallery">("grid");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const { data: collections } = useQuery<Collection[]>({
    queryKey: ["/api/users/1/collections"],
  });

  const { data: cards } = useQuery<Card[]>({
    queryKey: selectedCollection ? [`/api/collections/${selectedCollection}/cards`] : ["/api/cards/all"],
    enabled: !!selectedCollection,
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <Header title="Toutes les cartes" />

      <main className="relative z-10 px-4 pb-24">
        {/* User Stats */}
        {user && (
          <div className="bg-[hsl(214,35%,22%)] rounded-xl p-4 mb-4 gradient-overlay">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white font-poppins">{user.name}</h2>
                <p className="text-[hsl(212,23%,69%)] text-sm">@{user.username}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{user.totalCards?.toLocaleString()}</div>
                <div className="text-xs text-[hsl(212,23%,69%)]">Cartes totales</div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("gallery")}
              className={`p-2 rounded-lg ${
                viewMode === "gallery" ? "bg-[hsl(9,85%,67%)] text-white" : "bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)]"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-[hsl(214,35%,22%)] rounded-lg">
              <Search className="w-4 h-4 text-[hsl(212,23%,69%)]" />
            </button>
            <button className="p-2 bg-[hsl(214,35%,22%)] rounded-lg">
              <Filter className="w-4 h-4 text-[hsl(212,23%,69%)]" />
            </button>
          </div>
        </div>

        {/* Collection Selector */}
        <div className="mb-4">
          <select
            value={selectedCollection || ""}
            onChange={(e) => setSelectedCollection(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full bg-[hsl(214,35%,22%)] text-white rounded-lg p-3 border border-gray-600 font-poppins"
          >
            <option value="">Toutes les collections</option>
            {collections?.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name} ({collection.ownedCards}/{collection.totalCards})
              </option>
            ))}
          </select>
        </div>

        {/* Collections Grid */}
        {!selectedCollection && (
          <div className="collection-grid mb-6">
            {collections?.map((collection) => (
              <div 
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
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
                <div className="text-xs text-[hsl(212,23%,69%)] font-poppins">
                  {collection.ownedCards}/{collection.totalCards} cartes
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                  <div 
                    className="progress-bar h-1.5 rounded-full" 
                    style={{ width: `${collection.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards Display */}
        {selectedCollection && cards && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white font-poppins">
                {collections?.find(c => c.id === selectedCollection)?.name}
              </h3>
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-[hsl(9,85%,67%)] text-sm font-poppins"
              >
                Voir toutes
              </button>
            </div>

            {viewMode === "grid" ? (
              <div className="card-grid">
                {cards.map((card) => (
                  <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-2 card-hover relative">
                    {card.isOwned && card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        alt={`${card.playerName} card`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-600 rounded-lg flex items-center justify-center opacity-50">
                        <span className="text-gray-400 text-xs font-poppins">#{card.cardNumber}</span>
                      </div>
                    )}
                    <div className="text-xs mt-1 text-center font-poppins">
                      <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-[hsl(212,23%,69%)]'}`}>
                        {card.isOwned ? card.playerName : '?????'}
                      </div>
                      <div className="text-[hsl(212,23%,69%)]">{card.cardNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-3 flex items-center space-x-3">
                    <div className="w-16 h-20 bg-gray-600 rounded flex-shrink-0">
                      {card.isOwned && card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName} card`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-50">
                          <span className="text-gray-400 text-xs">{card.cardNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 font-poppins">
                      <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-[hsl(212,23%,69%)]'}`}>
                        {card.isOwned ? card.playerName : 'Carte manquante'}
                      </div>
                      <div className="text-[hsl(212,23%,69%)] text-sm">{card.cardNumber}</div>
                      {card.isSpecial && (
                        <div className="text-[hsl(9,85%,67%)] text-xs">Spéciale</div>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${card.isOwned ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Card Button */}
        <div className="fixed bottom-20 right-4 flex flex-col space-y-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center shadow-lg"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-[hsl(214,35%,22%)] rounded-full flex items-center justify-center shadow-lg"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </main>

      <Navigation />
    </div>
  );
}