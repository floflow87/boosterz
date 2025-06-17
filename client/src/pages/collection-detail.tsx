import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Plus, ArrowLeftRight, Check, HelpCircle } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";
import type { Collection, Card } from "@shared/schema";

export default function CollectionDetail() {
  const params = useParams();
  const collectionId = params.id ? parseInt(params.id) : 1;

  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/collections/${collectionId}/cards`],
  });

  if (collectionLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[hsl(216,46%,13%)] flex items-center justify-center">
        <div className="text-white">Collection non trouvée</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      
      <Header title={collection.name} showBackButton />

      <main className="relative z-10 px-4 pb-24">
        {/* Collection Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-[hsl(9,85%,67%)] to-[hsl(25,100%,70%)] rounded-2xl p-6 mb-4">
            <div className="w-24 h-32 bg-yellow-400 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-[hsl(216,46%,13%)] font-bold text-lg text-center">
                {collection.name.split(' ')[0]}<br />
                {collection.name.split(' ')[1]}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white font-luckiest">{collection.name}</h1>
            <p className="text-white opacity-90 font-poppins">Saison {collection.season}</p>
          </div>

          <div className="flex justify-center space-x-6 text-center">
            <div>
              <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{collection.totalCards}</div>
              <div className="text-xs text-[hsl(212,23%,69%)]">Cartes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{collection.ownedCards}</div>
              <div className="text-xs text-[hsl(212,23%,69%)]">Possédées</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(9,85%,67%)]">{collection.completionPercentage}%</div>
              <div className="text-xs text-[hsl(212,23%,69%)]">Complété</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto scroll-container">
          <button className="px-4 py-2 bg-[hsl(9,85%,67%)] text-white rounded-full text-sm font-medium whitespace-nowrap">
            Toutes
          </button>
          <button className="px-4 py-2 bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] rounded-full text-sm whitespace-nowrap">
            Possédées
          </button>
          <button className="px-4 py-2 bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] rounded-full text-sm whitespace-nowrap">
            Manquantes
          </button>
          <button className="px-4 py-2 bg-[hsl(214,35%,22%)] text-[hsl(212,23%,69%)] rounded-full text-sm whitespace-nowrap">
            Spéciales
          </button>
        </div>

        {/* Cards Grid */}
        <div className="card-grid">
          {cards?.map((card) => (
            <div key={card.id} className="bg-[hsl(214,35%,22%)] rounded-lg p-2 card-hover relative">
              {card.isOwned && card.imageUrl ? (
                <>
                  <img 
                    src={card.imageUrl} 
                    alt={`${card.playerName} card`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-32 bg-gray-600 rounded-lg flex items-center justify-center opacity-50">
                  <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="text-xs mt-1 text-center">
                <div className={`font-medium ${card.isOwned ? 'text-white' : 'text-[hsl(212,23%,69%)]'}`}>
                  {card.isOwned ? card.playerName : '?????'}
                </div>
                <div className="text-[hsl(212,23%,69%)]">{card.cardNumber}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button className="flex-1 bg-[hsl(9,85%,67%)] text-white py-3 rounded-xl font-semibold">
            <Plus className="w-5 h-5 inline mr-2" />
            Ajouter carte
          </button>
          <button 
            onClick={() => window.location.href = `/checklist/${collectionId}`}
            className="flex-1 bg-[hsl(214,35%,22%)] text-white py-3 rounded-xl font-semibold"
          >
            <Check className="w-5 h-5 inline mr-2" />
            Checklist
          </button>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
