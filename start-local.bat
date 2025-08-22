@echo off
title VCF Bot - Test Local

echo 🚀 Démarrage du test local du Bot VCF
echo ======================================

REM Vérifier Node.js
echo 📋 Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    pause
    exit /b 1
)
echo ✅ Node.js version:
node --version

REM Vérifier npm
echo 📋 Vérification de npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé
    pause
    exit /b 1
)
echo ✅ npm version:
npm --version

REM Aller dans le dossier du bot
cd BOT-VCF

REM Installer les dépendances
echo 📦 Installation des dépendances...
npm install

REM Créer le fichier .env s'il n'existe pas
if not exist .env (
    echo ⚠️  Fichier .env manquant, création...
    echo BOT_NAME=VCF Bot > .env
    echo BOT_VERSION=1.0.0 >> .env
    echo BOT_API_KEY=VCF2025_DYBY_SECRET_API_KEY_789xyz >> .env
    echo PORT=8000 >> .env
    echo NODE_ENV=development >> .env
)

echo.
echo 🎯 Configuration des variables d'environnement :
echo BOT_NAME=VCF Bot
echo BOT_VERSION=1.0.0  
echo BOT_API_KEY=VCF2025_DYBY_SECRET_API_KEY_789xyz
echo PORT=8000
echo NODE_ENV=development

echo.
echo 🚀 Démarrage du bot...
echo 🌐 Interface web: http://localhost:8000
echo 🔗 Santé: http://localhost:8000/health
echo 📱 API: http://localhost:8000/send-message
echo.
echo 🛑 Appuyez sur Ctrl+C pour arrêter
echo.

REM Démarrer le bot
npm start

pause
