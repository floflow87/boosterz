import type { User, Collection, Card } from "@shared/schema";

export const mockUser: User = {
  id: 1,
  username: "flo87",
  name: "FLORENT MARTIN",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
  totalCards: 1247,
  collectionsCount: 4,
  completionPercentage: 76
};

export const mockCollections: Collection[] = [
  {
    id: 1,
    userId: 1,
    name: "SCORE LIGUE 1",
    season: "23/24",
    totalCards: 234,
    ownedCards: 156,
    completionPercentage: 67,
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
    backgroundColor: "#F37261"
  },
  {
    id: 2,
    userId: 1,
    name: "IMMACULATE",
    season: "23/24",
    totalCards: 156,
    ownedCards: 70,
    completionPercentage: 45,
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
    backgroundColor: "#F37261"
  },
  {
    id: 3,
    userId: 1,
    name: "Set 125 ans OM",
    season: "22/23",
    totalCards: 89,
    ownedCards: 82,
    completionPercentage: 92,
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
    backgroundColor: "#F37261"
  },
  {
    id: 4,
    userId: 1,
    name: "QUI ES-TU?",
    season: "23/24",
    totalCards: 312,
    ownedCards: 87,
    completionPercentage: 28,
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
    backgroundColor: "#F37261"
  }
];
