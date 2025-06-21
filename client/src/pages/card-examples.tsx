import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import CardDisplay from "@/components/card-display";
import type { Card } from "@shared/schema";

export default function CardExamples() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Get some sample cards for demonstration
  const { data: cardsResponse } = useQuery<{cards: Card[]}>({
    queryKey: ['/api/collections/1/cards'],
  });

  const cards = cardsResponse?.cards || [];
  const sampleCards = cards.slice(0, 12); // Take first 12 cards for examples

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    console.log('Card clicked:', card);
  };

  const handleToggleOwnership = (cardId: number, isOwned: boolean) => {
    console.log('Toggle ownership:', cardId, isOwned);
  };

  const handleToggleFeatured = (cardId: number) => {
    console.log('Toggle featured:', cardId);
  };

  const handleTradeClick = (card: Card) => {
    console.log('Trade clicked:', card);
  };

  const handleShareClick = (card: Card) => {
    console.log('Share clicked:', card);
  };

  const handleFavoriteClick = (card: Card) => {
    console.log('Favorite clicked:', card);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Exemples d'utilisation du composant CardDisplay</h1>
        
        {/* Grid View Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Vue Grille - Variantes du composant</h2>
          
          {/* Default Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Grille par défaut avec actions complètes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sampleCards.slice(0, 6).map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  viewMode="grid"
                  onCardClick={handleCardClick}
                  onToggleOwnership={handleToggleOwnership}
                  onToggleFeatured={handleToggleFeatured}
                  onTradeClick={handleTradeClick}
                  showActions={true}
                  showTradeInfo={true}
                  variant="default"
                />
              ))}
            </div>
          </div>

          {/* Compact Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Grille compacte pour galerie</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {sampleCards.slice(0, 8).map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  viewMode="grid"
                  onCardClick={handleCardClick}
                  showActions={false}
                  showTradeInfo={false}
                  variant="compact"
                />
              ))}
            </div>
          </div>

          {/* Detailed Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Grille détaillée avec statistiques</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sampleCards.slice(0, 4).map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  viewMode="grid"
                  onCardClick={handleCardClick}
                  onToggleOwnership={handleToggleOwnership}
                  onToggleFeatured={handleToggleFeatured}
                  onTradeClick={handleTradeClick}
                  onShareClick={handleShareClick}
                  onFavoriteClick={handleFavoriteClick}
                  showActions={true}
                  showTradeInfo={true}
                  showStats={true}
                  variant="detailed"
                />
              ))}
            </div>
          </div>
        </section>

        {/* List View Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Vue Liste - Différents cas d'usage</h2>
          
          {/* Trading List */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Liste pour trading avec infos complètes</h3>
            <div className="space-y-3">
              {sampleCards.slice(0, 4).map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  viewMode="list"
                  onCardClick={handleCardClick}
                  onToggleOwnership={handleToggleOwnership}
                  onTradeClick={handleTradeClick}
                  showActions={true}
                  showTradeInfo={true}
                  variant="default"
                />
              ))}
            </div>
          </div>

          {/* Simple List */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Liste simple pour consultation</h3>
            <div className="space-y-2">
              {sampleCards.slice(4, 8).map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  viewMode="list"
                  onCardClick={handleCardClick}
                  showActions={false}
                  showTradeInfo={false}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Special States Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">États spéciaux</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Selected State */}
            <div>
              <h4 className="text-md font-medium mb-3">Carte sélectionnée</h4>
              <CardDisplay
                card={sampleCards[0]}
                viewMode="grid"
                isSelected={true}
                onCardClick={handleCardClick}
                showActions={true}
                variant="default"
              />
            </div>

            {/* Pulled Effect */}
            <div>
              <h4 className="text-md font-medium mb-3">Effet de tirage</h4>
              <CardDisplay
                card={sampleCards[1]}
                viewMode="grid"
                isPulledEffect={true}
                onCardClick={handleCardClick}
                showActions={true}
                variant="default"
              />
            </div>

            {/* Star Effect */}
            <div>
              <h4 className="text-md font-medium mb-3">Effet d'étoiles</h4>
              <CardDisplay
                card={sampleCards[2]}
                viewMode="grid"
                isStarEffect={true}
                onCardClick={handleCardClick}
                showActions={true}
                variant="default"
              />
            </div>

            {/* Featured Card */}
            <div>
              <h4 className="text-md font-medium mb-3">Carte mise à la une</h4>
              <CardDisplay
                card={{...sampleCards[3], isFeatured: true}}
                viewMode="grid"
                onCardClick={handleCardClick}
                onToggleFeatured={handleToggleFeatured}
                showActions={true}
                variant="default"
              />
            </div>
          </div>
        </section>

        {/* Integration Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Exemples d'intégration</h2>
          
          {/* Search Results */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Résultats de recherche</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-3">Recherche: "Mbappé" - 2 résultats trouvés</div>
              <div className="space-y-2">
                {sampleCards.slice(0, 2).map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={card}
                    viewMode="list"
                    onCardClick={handleCardClick}
                    showActions={true}
                    showTradeInfo={true}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Wishlist */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Liste de souhaits</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sampleCards.slice(0, 4).map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={{...card, isOwned: false}}
                    viewMode="grid"
                    onCardClick={handleCardClick}
                    onFavoriteClick={handleFavoriteClick}
                    showActions={false}
                    showTradeInfo={false}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Trading Interface */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Interface de trade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-3">Mes cartes à échanger</h4>
                <div className="space-y-2">
                  {sampleCards.slice(0, 2).map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={{...card, isForTrade: true, tradePrice: "€15"}}
                      viewMode="list"
                      onCardClick={handleCardClick}
                      onTradeClick={handleTradeClick}
                      showActions={true}
                      showTradeInfo={true}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-3">Cartes recherchées</h4>
                <div className="space-y-2">
                  {sampleCards.slice(2, 4).map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={{...card, isOwned: false}}
                      viewMode="list"
                      onCardClick={handleCardClick}
                      showActions={false}
                      showTradeInfo={false}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Selected Card Display */}
        {selectedCard && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Carte sélectionnée</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-6">
                <div className="w-64">
                  <CardDisplay
                    card={selectedCard}
                    viewMode="grid"
                    onCardClick={() => setSelectedCard(null)}
                    showActions={false}
                    variant="detailed"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{selectedCard.playerName}</h3>
                  <p className="text-gray-400 mb-2">{selectedCard.teamName}</p>
                  <p className="text-sm text-gray-500 mb-4">Référence: #{selectedCard.reference}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="ml-2 text-white">{selectedCard.cardType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">État:</span>
                      <span className={`ml-2 ${selectedCard.isOwned ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedCard.isOwned ? 'Possédée' : 'Manquante'}
                      </span>
                    </div>
                    {selectedCard.rarity && (
                      <div>
                        <span className="text-gray-400">Rareté:</span>
                        <span className="ml-2 text-white">{selectedCard.rarity}</span>
                      </div>
                    )}
                    {selectedCard.numbering && (
                      <div>
                        <span className="text-gray-400">Numérotation:</span>
                        <span className="ml-2 text-white">{selectedCard.numbering}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}