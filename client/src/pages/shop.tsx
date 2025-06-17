import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { ShoppingCart, Star, Package, Truck } from "lucide-react";

export default function Shop() {
  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20">
      <Header title="Shop" />
      
      <div className="p-4 space-y-6">
        {/* Promotions */}
        <div className="bg-gradient-to-r from-[hsl(9,85%,67%)] to-[hsl(9,85%,57%)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-luckiest">Nouveauté</h2>
              <p className="text-sm opacity-90">Score Ligue 1 2023/24</p>
              <p className="text-xs opacity-75">Pack de 7 cartes - 2,99€</p>
            </div>
            <Package className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Catégories */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Catégories</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Boosters", count: "12 produits", icon: Package, color: "from-blue-500 to-blue-600" },
              { name: "Starter Decks", count: "5 produits", icon: Star, color: "from-purple-500 to-purple-600" },
              { name: "Collections", count: "8 produits", icon: ShoppingCart, color: "from-green-500 to-green-600" },
              { name: "Accessoires", count: "15 produits", icon: Truck, color: "from-orange-500 to-orange-600" }
            ].map((category, index) => (
              <div key={index} className={`bg-gradient-to-br ${category.color} rounded-lg p-4`}>
                <category.icon className="w-8 h-8 mb-2" />
                <h3 className="font-bold font-poppins">{category.name}</h3>
                <p className="text-xs opacity-75">{category.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Produits populaires */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Populaires</h2>
          
          <div className="space-y-3">
            {[
              { 
                name: "Booster Score Ligue 1 2023/24", 
                price: "2,99€", 
                originalPrice: "3,50€",
                description: "7 cartes dont 1 garantie rare",
                rating: 4.8,
                inStock: true
              },
              { 
                name: "Starter Deck PSG", 
                price: "12,99€", 
                description: "Collection complète PSG 2023/24",
                rating: 4.6,
                inStock: true
              },
              { 
                name: "Mega Pack Ligue 1", 
                price: "24,99€", 
                originalPrice: "29,99€",
                description: "50 cartes + 5 cartes spéciales",
                rating: 4.9,
                inStock: false
              },
              { 
                name: "Classeur Premium", 
                price: "19,99€", 
                description: "Protège 360 cartes",
                rating: 4.7,
                inStock: true
              }
            ].map((product, index) => (
              <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold font-poppins text-white">{product.name}</h3>
                    <p className="text-sm text-[hsl(212,23%,69%)] mb-2">{product.description}</p>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm ml-1">{product.rating}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.inStock 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.inStock ? 'En stock' : 'Rupture'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-[hsl(9,85%,67%)]">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      product.inStock
                        ? 'bg-[hsl(9,85%,67%)] text-white hover:bg-[hsl(9,85%,57%)]'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'Ajouter' : 'Indisponible'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations livraison */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-[hsl(9,85%,67%)]" />
            <div>
              <h3 className="font-bold font-poppins">Livraison gratuite</h3>
              <p className="text-sm text-[hsl(212,23%,69%)]">Dès 25€ d'achat - Livraison en 2-3 jours</p>
            </div>
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}