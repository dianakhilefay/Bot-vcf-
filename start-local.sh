#!/bin/bash

echo "🚀 Démarrage du test local du Bot VCF"
echo "======================================"

# Vérifier Node.js
echo "📋 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Vérifier npm
echo "📋 Vérification de npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi
echo "✅ npm version: $(npm --version)"

# Aller dans le dossier du bot
cd BOT-VCF

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Vérifier le fichier .env
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant, création à partir de .env.example..."
    cp .env.example .env
    echo "📝 Veuillez configurer les variables dans .env"
fi

echo ""
echo "🎯 Configuration des variables d'environnement :"
echo "BOT_NAME=VCF Bot"
echo "BOT_VERSION=1.0.0"  
echo "BOT_API_KEY=VCF2025_DYBY_SECRET_API_KEY_789xyz"
echo "PORT=8000"
echo "NODE_ENV=development"

# Créer le fichier .env s'il n'existe pas
cat > .env << EOF
BOT_NAME=VCF Bot
BOT_VERSION=1.0.0
BOT_API_KEY=VCF2025_DYBY_SECRET_API_KEY_789xyz
PORT=8000
NODE_ENV=development
EOF

echo ""
echo "🚀 Démarrage du bot..."
echo "🌐 Interface web: http://localhost:8000"
echo "🔗 Santé: http://localhost:8000/health"
echo "📱 API: http://localhost:8000/send-message"
echo ""
echo "🛑 Appuyez sur Ctrl+C pour arrêter"
echo ""

# Démarrer le bot
npm start
