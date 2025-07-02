# CORRECTIONS URGENTES PRODUCTION

## Problèmes Identifiés

### 1. Script populate checklist corrigé
❌ **Erreur SQL** : `CASE/WHEN must not return a set`
✅ **Solution** : `populate-checklist-fixed.sql` créé avec WITH clauses

### 2. Posts ne se créent pas en production
❌ **Problème** : Route POST /api/posts existe mais méthode createPost manquante dans storage
✅ **Solution** : Ajouter méthode createPost et createActivity dans storage.ts

### 3. Messages 500 sur conversations
❌ **Problème** : Méthodes de chat manquantes ou défaillantes
✅ **Solution** : Vérifier et corriger les méthodes de messages dans storage.ts

## Actions Correctives

### A. Script SQL Corrigé
```sql
-- Utiliser populate-checklist-fixed.sql au lieu de l'original
-- WITH clauses résolvent l'erreur CASE/WHEN
```

### B. Méthodes Storage Manquantes
```typescript
// Ajouter dans storage.ts :
async createPost(data: any): Promise<Post>
async createActivity(data: any): Promise<Activity>
async createMessage(data: any): Promise<Message>
async getPost(id: number): Promise<Post>
async deletePost(id: number): Promise<boolean>
```

### C. Tests API À Faire
- POST /api/posts (création posts)
- POST /api/messages/send (envoi messages)
- GET /api/chat/conversations (conversations)

## Déploiement
1. Exécuter `populate-checklist-fixed.sql` 
2. Mettre à jour storage.ts avec méthodes manquantes
3. Tester en production