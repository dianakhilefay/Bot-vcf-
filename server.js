const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const app = express();
const PORT = process.env.PORT || 8000;

console.log('🚀 Démarrage du serveur VCF Bot avec pairing code...');

// Variables globales pour la session WhatsApp
let sock = null;
let qrData = null;
let isConnected = false;
let connectionStatus = 'disconnected';

// Code personnalisé
const CUSTOM_PAIRING_CODE = process.env.CUSTOM_PAIRING_CODE || "MARCTECH";

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Fonction pour créer la connexion WhatsApp
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Désactiver le QR code
      browser: ['VCF Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔄 Connexion fermée, reconnexion...', shouldReconnect);
        connectionStatus = 'disconnected';
        isConnected = false;
        
        if (shouldReconnect) {
          connectToWhatsApp();
        }
      } else if (connection === 'open') {
        console.log('✅ Connexion WhatsApp établie !');
        connectionStatus = 'connected';
        isConnected = true;
      }
    });

    sock.ev.on('creds.update', saveCreds);
    
    return sock;
  } catch (error) {
    console.error('❌ Erreur connexion WhatsApp:', error);
    connectionStatus = 'error';
    throw error;
  }
}

// Route pour demander un code de jumelage
app.post('/pairing-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Numéro de téléphone requis' 
      });
    }

    // Nettoyer le numéro de téléphone
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    console.log(`📱 Demande de code pour: ${cleanPhone}`);

    // Initialiser la connexion si pas déjà fait
    if (!sock) {
      sock = await connectToWhatsApp();
    }

    // Attendre 3 secondes comme dans votre script
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Demander le code de jumelage
    const pairingCode = await sock.requestPairingCode(cleanPhone);
    
    // Utiliser votre code personnalisé ou le code généré
    const finalCode = CUSTOM_PAIRING_CODE || pairingCode;
    
    // Formater avec des tirets comme dans votre script
    const formattedCode = finalCode.match(/.{1,4}/g)?.join('-') || finalCode;
    
    console.log(`🔗 Code de jumelage généré: ${formattedCode}`);
    
    res.json({
      success: true,
      pairingCode: formattedCode,
      phoneNumber: cleanPhone,
      message: 'Code de jumelage généré avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur génération code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du code',
      error: error.message
    });
  }
});

// Route principale avec interface pairing code
app.get('/', (req, res) => {
  console.log('📱 Accès à l\'interface web principale');
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🤖 VCF Bot - Connexion par Code</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .container { 
          background: white; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%;
          text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .logo { font-size: 80px; margin-bottom: 20px; animation: bounce 2s infinite; }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        h1 { color: #25D366; margin-bottom: 10px; font-size: 28px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 16px; }
        .feature { background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 20px 0; }
        .feature h3 { color: #128C7E; margin-bottom: 5px; }
        .input-group { margin: 25px 0; }
        input { 
          padding: 15px; width: 100%; border: 2px solid #e0e0e0; border-radius: 10px; 
          font-size: 16px; transition: all 0.3s ease;
        }
        input:focus { outline: none; border-color: #25D366; box-shadow: 0 0 10px rgba(37,211,102,0.3); }
        button { 
          background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; 
          padding: 15px 30px; border-radius: 10px; font-size: 16px; font-weight: bold;
          cursor: pointer; width: 100%; margin-top: 10px; transition: all 0.3s ease;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(37,211,102,0.4); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .result { 
          background: linear-gradient(135deg, #e8f5e8, #f1f8e9); border: 2px solid #25D366; 
          border-radius: 15px; padding: 20px; margin: 20px 0; font-size: 24px; 
          font-weight: bold; color: #128C7E; display: none; letter-spacing: 2px;
        }
        .instructions { 
          background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; 
          padding: 15px; margin: 20px 0; font-size: 14px; color: #856404;
        }
        .status { margin-top: 20px; padding: 10px; border-radius: 10px; font-size: 14px; }
        .status.online { background: #e8f5e8; color: #2e7d32; }
        .status.connecting { background: #fff3cd; color: #856404; }
        .status.offline { background: #ffebee; color: #c62828; }
        .links { margin-top: 30px; }
        .links a { 
          color: #25D366; text-decoration: none; margin: 0 15px; 
          padding: 8px 15px; border-radius: 20px; transition: all 0.3s ease;
        }
        .links a:hover { background: #25D366; color: white; }
        .loading { display: none; margin: 10px 0; }
        .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #25D366; 
                   border-radius: 50%; width: 30px; height: 30px; 
                   animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📱</div>
        <h1>VCF Bot MARCTECH</h1>
        <div class="subtitle">Connexion par Code de Jumelage</div>
        
        <div class="feature">
          <h3>🔗 Code Personnalisé</h3>
          <p>Utilise le code MARCTECH pour la connexion</p>
        </div>
        
        <div class="input-group">
          <input type="tel" id="phone" placeholder="+225XXXXXXXX" maxlength="15">
        </div>
        
        <button onclick="getPairingCode()" id="connectBtn">
          🔗 Obtenir le Code de Jumelage
        </button>
        
        <div class="loading" id="loading">
          <div class="spinner"></div>
          <p>Génération du code...</p>
        </div>
        
        <div id="result" class="result"></div>
        
        <div class="instructions" id="instructions" style="display: none;">
          <strong>📋 Instructions:</strong><br>
          1. Ouvrez WhatsApp sur votre téléphone<br>
          2. Allez dans Paramètres > Appareils liés<br>
          3. Appuyez sur "Lier un appareil"<br>
          4. Saisissez le code affiché ci-dessus<br>
          5. Attendez la confirmation de connexion
        </div>
        
        <div class="status connecting" id="status">🟡 Prêt à se connecter</div>
        
        <div class="links">
          <a href="/status" target="_blank">📊 Statut</a>
          <a href="/health" target="_blank">💚 Santé</a>
        </div>
      </div>

      <script>
        let isConnecting = false;

        async function getPairingCode() {
          if (isConnecting) return;
          
          const phone = document.getElementById('phone').value.trim();
          const resultDiv = document.getElementById('result');
          const statusDiv = document.getElementById('status');
          const instructionsDiv = document.getElementById('instructions');
          const loadingDiv = document.getElementById('loading');
          const connectBtn = document.getElementById('connectBtn');
          
          // Validation du numéro
          if (!phone) {
            alert('❌ Veuillez entrer un numéro de téléphone');
            return;
          }
          
          if (!phone.match(/^\\+\\d{8,15}$/)) {
            alert('❌ Format invalide. Utilisez +225XXXXXXXX (8-15 chiffres)');
            return;
          }
          
          isConnecting = true;
          connectBtn.disabled = true;
          loadingDiv.style.display = 'block';
          statusDiv.className = 'status connecting';
          statusDiv.innerHTML = '🟡 Génération du code...';
          
          try {
            const response = await fetch('/pairing-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: phone })
            });
            
            const data = await response.json();
            
            if (data.success && data.pairingCode) {
              resultDiv.innerHTML = '📱 Code: ' + data.pairingCode;
              resultDiv.style.display = 'block';
              instructionsDiv.style.display = 'block';
              statusDiv.className = 'status connecting';
              statusDiv.innerHTML = '🟡 En attente de connexion...';
              
              // Animation
              resultDiv.style.animation = 'slideUp 0.5s ease-out';
              
              // Vérifier le statut de connexion
              checkConnectionStatus();
              
            } else {
              throw new Error(data.message || 'Erreur inconnue');
            }
            
          } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur: ' + error.message);
            statusDiv.className = 'status offline';
            statusDiv.innerHTML = '🔴 Erreur de connexion';
          } finally {
            isConnecting = false;
            connectBtn.disabled = false;
            loadingDiv.style.display = 'none';
          }
        }

        // Vérifier le statut de connexion
        async function checkConnectionStatus() {
          try {
            const response = await fetch('/status');
            const data = await response.json();
            
            const statusDiv = document.getElementById('status');
            
            if (data.whatsappConnected) {
              statusDiv.className = 'status online';
              statusDiv.innerHTML = '🟢 WhatsApp connecté !';
            } else {
              setTimeout(checkConnectionStatus, 3000); // Vérifier toutes les 3 secondes
            }
          } catch (error) {
            console.log('⚠️ Erreur vérification statut');
          }
        }

        // Vérification initiale du statut
        window.onload = function() {
          checkConnectionStatus();
        };
      </script>
    </body>
    </html>
  `);
});
// Route de statut
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: '✅ VCF Bot est en ligne',
    whatsappConnected: isConnected,
    connectionStatus: connectionStatus,
    customCode: CUSTOM_PAIRING_CODE,
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    health: 'OK',
    service: 'VCF WhatsApp Bot MARCTECH',
    whatsappStatus: connectionStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Route de test pour Heroku
app.get('/test', (req, res) => {
  res.json({
    message: '🟢 Serveur fonctionnel',
    environment: process.env.NODE_ENV || 'development',
    whatsappConnected: isConnected,
    customPairingCode: CUSTOM_PAIRING_CODE,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Initialiser la connexion WhatsApp au démarrage
async function initializeBot() {
  try {
    console.log('🔄 Initialisation de la connexion WhatsApp...');
    await connectToWhatsApp();
  } catch (error) {
    console.error('❌ Erreur initialisation bot:', error);
  }
}

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`🚀 VCF Bot MARCTECH démarré avec succès !`);
  console.log(`🌐 Interface web: http://localhost:${PORT}`);
  console.log(`📊 Statut: http://localhost:${PORT}/status`);
  console.log(`💚 Santé: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
  console.log(`📱 Port: ${PORT}`);
  console.log(`🔑 Code personnalisé: ${CUSTOM_PAIRING_CODE}`);
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`);
  
  // Initialiser le bot WhatsApp
  await initializeBot();
});
