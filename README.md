# Bot-vcf- 🤖

Bot WhatsApp pour VCF Generator - Envoi automatique de messages de bienvenue.

## 🚀 Fonctionnalités

- ✅ Réception d'appels API pour envoi de messages
- ✅ Plugin statistiques pour les utilisateurs
- ✅ Authentification par clé API sécurisée
- ✅ Gestion automatique des sessions WhatsApp
- ✅ Endpoints de monitoring et santé
- ✅ Support multi-sessions

## 📋 Prérequis

- Node.js 18+
- Compte WhatsApp pour le bot
- Variables d'environnement configurées
- API VCF déployée

## 🛠️ Installation

```bash
git clone https://github.com/dianakhilefay/Bot-vcf-.git
cd Bot-vcf-
npm install
```

## 🌐 Interface Web

Le bot inclut une interface web pour la connexion et la gestion :

### Accès Local
```
http://localhost:8000
```

### Accès Heroku
```
https://votre-app.herokuapp.com
```

### Fonctionnalités Interface
- 📱 Connexion WhatsApp via QR Code
- 🔢 Connexion par code de jumelage  
- 📊 Monitoring en temps réel
- 🔍 Vérification de santé
- 📈 Statistiques de connexion

## ⚙️ Configuration

1. Copiez `.env.example` vers `.env`
2. Configurez vos variables :

```env
BOT_NAME=VCF Bot
BOT_VERSION=1.0.0
BOT_API_KEY=VCF2025_DYBY_SECRET_API_KEY_789xyz
PORT=8000
NODE_ENV=production
```

## 🏃‍♂️ Démarrage

### Développement Local

**Windows :**
```cmd
start-local.bat
```

**Linux/Mac :**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Manuel :**
```bash
# Développement
npm run dev

# Production
npm start
```

### Interface Web
Une fois démarré, accédez à : http://localhost:8000

## 📡 Endpoints API

### POST `/send-message`
Reçoit les demandes d'envoi de messages depuis l'API VCF.

**Headers:**
```
Authorization: Bearer VCF2025_DYBY_SECRET_API_KEY_789xyz
Content-Type: application/json
```

**Body:**
```json
{
  "to": "+225xxxxxxxxx",
  "message": "Message de bienvenue..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "to": "225xxxxxxxxx@s.whatsapp.net"
}
```

### POST `/pairing-code`
Génère un code de jumelage pour un numéro.

**Body:**
```json
{
  "phoneNumber": "+225xxxxxxxxx"
}
```

**Response:**
```json
{
  "pairingCode": "ABC123",
  "phoneNumber": "+225xxxxxxxxx",
  "status": "Pairing code generated successfully"
}
```

### GET `/health`
Vérifie l'état du bot.

**Response:**
```json
{
  "status": "healthy",
  "service": "VCF WhatsApp Bot",
  "version": "1.0.0",
  "activeConnections": 1,
  "uptime": 3600
}
```

### GET `/status`
Informations sur le statut du bot.

## 🤖 Commandes Bot

### `.stat` / `.stats` / `.statistiques`
Affiche les statistiques du site VCF Generator.

**Réponse:**
```
📊 Statistiques VCF Generator

👥 Utilisateurs inscrits: 150
🟢 Utilisateurs actifs: 120
📈 Messages ce mois: 750
📅 Inscriptions aujourd'hui: 12

🤖 Bot: VCF Bot v1.0.0
⚡ Statut: En ligne
```

## 🚀 Déploiement sur Heroku

```bash
# Créer l'app Heroku
heroku create bot-vcf-whatsapp

# Configurer les variables d'environnement
heroku config:set BOT_NAME="VCF Bot"
heroku config:set BOT_VERSION="1.0.0"
heroku config:set BOT_API_KEY="VCF2025_DYBY_SECRET_API_KEY_789xyz"
heroku config:set NODE_ENV="production"

# Déployer
git push heroku main
```

## 🔗 Intégration avec l'API

L'API VCF appelle le bot comme ceci :

```javascript
const response = await fetch('https://bot-vcf-whatsapp.herokuapp.com/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer VCF2025_DYBY_SECRET_API_KEY_789xyz'
  },
  body: JSON.stringify({
    to: '+225xxxxxxxxx',
    message: 'Message de bienvenue...'
  })
});
```

## 📝 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `BOT_NAME` | Nom du bot | `VCF Bot` |
| `BOT_VERSION` | Version du bot | `1.0.0` |
| `BOT_API_KEY` | Clé d'authentification API | `secret123` |
| `PORT` | Port d'écoute | `8000` |
| `NODE_ENV` | Environnement | `production` |

## 🔒 Sécurité

- Authentification par clé API obligatoire
- Sessions WhatsApp chiffrées localement
- Validation des entrées utilisateur
- Gestion d'erreurs sécurisée

## 🐛 Débogage

```bash
# Vérifier la santé du bot
curl https://bot-vcf-whatsapp.herokuapp.com/health

# Tester l'envoi d'un message
curl -X POST https://bot-vcf-whatsapp.herokuapp.com/send-message \
  -H "Authorization: Bearer VCF2025_DYBY_SECRET_API_KEY_789xyz" \
  -H "Content-Type: application/json" \
  -d '{"to": "+225xxxxxxxxx", "message": "Test message"}'

# Vérifier les logs Heroku
heroku logs --tail -a bot-vcf-whatsapp
```

## 📊 Monitoring

Le bot fournit des endpoints de monitoring :
- `/health` - État de santé détaillé
- `/status` - Informations sur le statut
- Logs automatiques des actions importantes

## 👨‍💻 Auteur

**dianakhilefay**
- GitHub: [@dianakhilefay](https://github.com/dianakhilefay)
- API VCF: [Api-Bot](https://github.com/dianakhilefay/Api-Bot)
- Site VCF: [VCF Generator](https://github.com/dianakhilefay/VCF-)

---

🔗 **Flux complet:**
1. Utilisateur saisit son numéro sur le site VCF
2. Site appelle l'API VCF
3. API VCF appelle ce bot WhatsApp
4. Bot envoie le message de bienvenue
5. Utilisateur peut utiliser `.stat` pour voir les statistiques
