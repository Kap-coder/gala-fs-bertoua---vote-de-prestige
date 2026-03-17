# 🗳️ Système de Vote - FS Bertoua

Cette application est un système de vote en ligne sécurisé conçu pour la soirée culturelle de la Faculté des Sciences de Bertoua.

## 🚀 Fonctionnalités

- **Authentification Sécurisée** : Connexion via Google.
- **Vote Unique** : Chaque utilisateur ne peut voter qu'une seule fois.
- **Dashboard Admin** :
  - Gestion des candidats (Ajout/Suppression).
  - Suivi des participants et de leur statut de vote.
  - Résultats en temps réel avec graphiques interactifs.
- **Design Moderne** : Interface responsive, propre et élégante avec Tailwind CSS.
- **Sécurité Firestore** : Règles de sécurité strictes pour empêcher la fraude.

## 🛠️ Installation Locale

1. **Cloner le projet**
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

## ⚙️ Configuration Firebase

L'application est déjà configurée avec Firebase. Voici les étapes effectuées :
1. **Firestore** : Collections `users`, `candidates`, et `votes`.
2. **Authentification** : Google Sign-In activé.
3. **Règles de Sécurité** : Déployées pour garantir qu'un utilisateur ne vote qu'une fois et que seul l'admin peut modifier les candidats.

### Accès Admin
L'utilisateur avec l'email `angekapel007@gmail.com` est automatiquement reconnu comme administrateur.

## 🌐 Déploiement (Netlify / Vercel)

### Sur Netlify :
1. Connectez votre dépôt GitHub.
2. Configurez les paramètres de build :
   - **Build Command** : `npm run build`
   - **Publish Directory** : `dist`
3. Ajoutez les variables d'environnement si nécessaire (bien que `firebase-applet-config.json` soit inclus).

### Sur Vercel :
1. Importez le projet depuis GitHub.
2. Vercel détectera automatiquement Vite.
3. Cliquez sur **Deploy**.

## 🔐 Sécurité Firestore

Les règles de sécurité (`firestore.rules`) assurent :
- Que les utilisateurs ne peuvent pas modifier leur propre rôle.
- Qu'un utilisateur ne peut créer qu'un seul document de vote.
- Que le compteur de votes d'un candidat ne peut être incrémenté que de 1 à la fois.
- Que les données sensibles (emails des autres utilisateurs) ne sont visibles que par l'admin.

---
Développé avec ❤️ pour la Faculté des Sciences de Bertoua.
