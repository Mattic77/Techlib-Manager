# TechLib Manager - Guide d'Installation

Ce projet est un système de gestion de bibliothèque technique (TechLib Manager) intégrant des fonctionnalités d'IA avancées. Ce guide explique comment installer et lancer l'ensemble du système sur votre machine locale en utilisant Docker.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :
- **Docker Desktop** (incluant Docker Compose)
- **Git**

## 🚀 Installation Rapide (Docker)

La méthode recommandée pour lancer le projet est d'utiliser Docker Compose, qui configure automatiquement la base de données, le backend, le frontend et les services d'IA.

### 1. Cloner le projet
```bash
git clone <url-du-depot>
cd techlib-manager
```

### 2. Configuration de l'environnement
Copiez le fichier d'exemple et configurez vos variables (les valeurs par défaut fonctionnent pour un test local) :
```bash
cp .env.example .env
```

### 3. Lancer les services
Cette commande va construire les images et démarrer tous les conteneurs (MySQL, Redis, Qdrant, Ollama, Backend, Frontend, Nginx).
```bash
docker-compose up -d --build
```
*Note : Le premier lancement peut prendre quelques minutes le temps de télécharger les images et d'installer les dépendances.*

---

## 🛠️ Initialisation de la Base de Données

Une fois que les conteneurs sont en cours d'exécution, vous devez initialiser la structure de la base de données et ajouter des données de test.

### 1. Appliquer les migrations (Alembic)
Crée les tables dans MySQL :
```bash
docker-compose exec backend alembic upgrade head
```

### 2. Ajouter les utilisateurs de test
```bash
docker-compose exec backend python -m backend.seed.seed_users
```

### 3. Ajouter le catalogue technique (50 documents + IA)
Cette étape insère les documents et génère les vecteurs d'IA dans Qdrant :
```bash
docker-compose exec backend python -m backend.seed.seed_documents
```

---

## 🌐 Accès aux Services

Une fois l'installation terminée, vous pouvez accéder aux interfaces suivantes :

- **Application Web (Frontend)** : [http://localhost](http://localhost) (via Nginx sur le port 80)
- **Documentation API (Swagger)** : [http://localhost:8000/docs](http://localhost:8000/docs)
- **Gestionnaire de Base de Données (Adminer)** : [http://localhost:8080](http://localhost:8080)
    - *Système* : MySQL
    - *Serveur* : mysql
    - *Utilisateur/Mot de passe* : (Voir votre fichier .env)

---

## 👤 Comptes de Test

Voici les identifiants créés par le script de "seed" :

| Rôle | Utilisateur | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin` | `Admin@1234` |
| **Bibliothécaire** | `librarian_alice` | `Librarian@001` |
| **Lecteur** | `reader_david` | `Reader@001` |

---

## 💡 Commandes Utiles

- **Arrêter le système** : `docker-compose down`
- **Voir les logs du backend** : `docker-compose logs -f backend`
- **Réinitialiser tout le système (Attention : supprime les données)** :
  ```bash
  docker-compose down -v
  docker-compose up -d --build
  ```

## 🧠 Fonctionnalités IA (Optionnel)
Le système utilise **Ollama** pour l'assistant de chat. Si vous souhaitez utiliser un modèle spécifique, vous pouvez le télécharger à l'intérieur du conteneur Ollama :
```bash
docker-compose exec ollama ollama pull llama3
```
*(Note : Nécessite une connexion internet et de la RAM libre).*
