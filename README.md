# Trading Card Collection Manager

Une application web sophistiquée pour la gestion de collections de cartes à collectionner avec suivi dynamique du portefeuille et interactions sociales immersives.

## Fonctionnalités

### 🎯 Gestion de Collections
- Suivi complet des cartes possédées/manquantes
- Sélection multiple pour mise à jour en lot
- Reconnaissance automatique de cartes par photo
- Affichage en grille ou liste avec filtres avancés

### 💬 Système de Messagerie
- Chat en temps réel avec persistance des messages
- Support d'images dans les conversations
- Notifications dynamiques avec mise à jour automatique
- Interface utilisateur fluide avec défilement optimisé

### 🎨 Interface Utilisateur
- Thème sombre avec branding Captain Tsubasa
- Animations CSS fluides et transitions
- Défilement horizontal pour collections avec momentum
- Design responsive optimisé mobile

### 🔐 Authentification
- Système JWT sécurisé avec bcrypt
- Sessions persistantes
- Gestion des profils utilisateurs

## Technologies

### Frontend
- **React** avec TypeScript
- **Tailwind CSS** pour le styling
- **TanStack Query** pour la gestion d'état
- **Wouter** pour le routage
- **Framer Motion** pour les animations

### Backend
- **Node.js** avec Express
- **PostgreSQL** avec Drizzle ORM
- **WebSocket** pour le temps réel
- **JWT** pour l'authentification

## Installation

1. Clonez le repository
```bash
git clone [URL_DU_REPO]
cd trading-card-app
```

2. Installez les dépendances
```bash
npm install
```

3. Configurez la base de données
```bash
npm run db:push
```

4. Lancez l'application
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5000`

## Structure du Projet

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── pages/        # Pages de l'application
│   │   └── lib/          # Utilitaires
├── server/               # Backend Express
│   ├── auth.ts           # Authentification
│   ├── routes.ts         # Routes API
│   └── storage.ts        # Accès aux données
├── shared/               # Types partagés
│   └── schema.ts         # Schémas Drizzle
└── attached_assets/      # Assets utilisateur
```

## Fonctionnalités Principales

### Collections
- **Score Ligue 1 2023/24** : Collection principale avec cartes numérotées
- Gestion des parallèles, rookies et cartes spéciales
- Calcul automatique du pourcentage de complétion

### Chat et Social
- Conversations privées entre collectionneurs
- Partage d'images de cartes
- Système de notifications en temps réel

### Recherche et Filtres
- Recherche par nom de joueur, équipe ou référence
- Filtres par statut (possédées/manquantes)
- Tri et organisation personnalisés

## API Endpoints

### Collections
- `GET /api/users/:id/collections` - Liste des collections
- `GET /api/collections/:id/cards` - Cartes d'une collection
- `POST /api/cards/:id/ownership` - Marquer carte comme possédée

### Chat
- `GET /api/chat/conversations` - Conversations utilisateur
- `POST /api/chat/conversations/:id/messages` - Envoyer message
- `WebSocket /ws` - Messages temps réel

## Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commitez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push sur la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.