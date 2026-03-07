#!/bin/bash

# Script d'initialisation Firebase pour Max-Morrys Platform
# Ce script aide à configurer Firebase pour la première fois

echo "=========================================="
echo "  Max-Morrys - Configuration Firebase"
echo "=========================================="
echo ""

# Vérifier si Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé."
    echo "📦 Installation de Firebase CLI..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI est déjà installé"
fi

echo ""
echo "🔐 Connexion à Firebase..."
firebase login

echo ""
echo "📋 Projets Firebase disponibles :"
firebase projects:list

echo ""
read -p "Entrez l'ID de votre projet Firebase (ou appuyez sur Entrée pour 'maxmorrys-platform'): " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-maxmorrys-platform}

echo ""
echo "🔗 Configuration du projet : $PROJECT_ID"
firebase use $PROJECT_ID

echo ""
echo "📤 Déploiement des règles Firestore..."
firebase deploy --only firestore:rules

echo ""
echo "📊 Déploiement des indexes Firestore..."
firebase deploy --only firestore:indexes

echo ""
echo "🗄️  Déploiement des règles Storage..."
firebase deploy --only storage

echo ""
echo "=========================================="
echo "✅ Configuration Firebase terminée !"
echo "=========================================="
echo ""
echo "Prochaines étapes :"
echo ""
echo "1. Créer le premier utilisateur admin dans Firebase Console"
echo "   - Aller dans Authentication > Add user"
echo "   - Créer un utilisateur avec votre email"
echo ""
echo "2. Créer le document utilisateur dans Firestore :"
echo "   - Aller dans Firestore Database"
echo "   - Collection : users"
echo "   - Document ID : [UID de l'utilisateur créé]"
echo "   - Données :"
echo '     {
       "uid": "UID_de_utilisateur",
       "email": "admin@maxmorrys.com",
       "displayName": "Max-Morrys",
       "role": "admin",
       "createdAt": "2026-02-26T00:00:00Z",
       "preferences": {
         "theme": "system",
         "language": "fr",
         "newsletter": true
       }
     }'
echo ""
echo "3. Créer le document settings/site :"
echo "   - Collection : settings"
echo "   - Document ID : site"
echo "   - Données :"
echo '     {
       "siteName": "Max-Morrys",
       "siteDescription": "Formateur et créateur de contenu digital",
       "contactEmail": "contact@maxmorrys.com",
       "contactPhone": "+221 77 000 00 00",
       "primaryColor": "#0c93e7",
       "defaultTheme": "system"
     }'
echo ""
echo "4. Configurer les variables d'environnement :"
echo "   - Copier .env.example vers .env"
echo "   - Remplir avec vos credentials Firebase"
echo ""
echo "5. Déployer l'application :"
echo "   npm run build"
echo "   firebase deploy --only hosting"
echo ""
echo "📚 Documentation complète : FIREBASE_SETUP.md"
echo ""
