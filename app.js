const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Configuration
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables globales
let sock = null;
let connectionStatus = 'disconnected';
let lastConnected = null;

// Logs avec couleurs
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleString();
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warning: '\x1b[33m' };
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
}

// Initialisation du bot WhatsApp
async function startBot() {
  try {
    log('🚀 Démarrage du bot WhatsApp VCF...', 'info');
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: require('pino')({ level: 'silent' }),
      browser: ['VCF Bot', 'Desktop', '1.0.0']
    });

    // Gestion des événements de connexion
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        log('📱 QR Code généré', 'info');
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        log(`❌ Connexion fermée. Reconnexion: ${shouldReconnect}`, 'warning');
        connectionStatus = 'disconnected';
        
        if (shouldReconnect) {
          setTimeout(() => startBot(), 3000);
        }
      } else if (connection === 'open') {
        log('✅ Bot connecté avec succès!', 'success');
        connectionStatus = 'connected';
        lastConnected = new Date().toISOString();
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    log(`❌ Erreur lors du démarrage: ${error.message}`, 'error');
    setTimeout(() => startBot(), 5000);
  }
}

// Routes API

// Route principale - Interface web
app.get('/', (req, res) => {
  try {
    log('📄 Serving web interface', 'info');
    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VCF Bot - Interface</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
          }
          .container {
            background: white; border-radius: 20px; padding: 40px;
            max-width: 450px; width: 90%; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          }
          .logo { font-size: 80px; margin-bottom: 20px; }
          h1 { color: #25D366; margin-bottom: 10px; font-size: 2.5em; }
          .subtitle { color: #666; margin-bottom: 30px; font-size: 1.1em; }
          .form-group { margin: 20px 0; }
          input[type="tel"] {
            width: 100%; padding: 15px; border: 2px solid #e0e0e0;
            border-radius: 10px; font-size: 16px; text-align: center;
            transition: border-color 0.3s;
          }
          input[type="tel"]:focus {
            outline: none; border-color: #25D366;
          }
          .btn {
            background: #25D366; color: white; border: none;
            padding: 15px 30px; border-radius: 10px; font-size: 16px;
            cursor: pointer; width: 100%; margin: 10px 0;
            transition: background 0.3s;
          }
          .btn:hover { background: #20b358; }
          .btn:disabled { background: #ccc; cursor: not-allowed; }
          .code-display {
            background: linear-gradient(135deg, #f1f8e9, #e8f5e8);
            border: 2px solid #4caf50; border-radius: 15px;
            padding: 20px; margin: 20px 0; display: none;
            animation: slideIn 0.5s ease-out;
          }
          .code-text {
            font-size: 24px; font-weight: bold; color: #2e7d32;
            letter-spacing: 3px; font-family: 'Courier New', monospace;
          }
          .status { margin: 20px 0; padding: 10px; border-radius: 8px; }
          .status.connected { background: #d4edda; color: #155724; }
          .status.disconnected { background: #f8d7da; color: #721c24; }
          .links { margin-top: 30px; }
          .links a {
            color: #25D366; text-decoration: none; margin: 0 10px;
            padding: 8px 15px; border: 1px solid #25D366; border-radius: 5px;
            transition: all 0.3s;
          }
          .links a:hover { background: #25D366; color: white; }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .loading {
            display: none; width: 30px; height: 30px; margin: 0 auto;
            border: 3px solid #f3f3f3; border-top: 3px solid #25D366;
            border-radius: 50%; animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🤖</div>
          <h1>VCF Bot</h1>
          <p class="subtitle">Interface de Connexion WhatsApp</p>
          
          <div id="status" class="status disconnected">
            🔴 Vérification du statut...
          </div>
          
          <div class="form-group">
            <input type="tel" id="phoneNumber" placeholder="+225XXXXXXXX" 
                   pattern="\\+[0-9]{8,15}" title="Format: +225XXXXXXXX">
          </div>
          
          <button class="btn" onclick="requestPairingCode()" id="pairBtn">
            📱 Obtenir le Code de Jumelage
          </button>
          
          <div class="loading" id="loading"></div>
          
          <div class="code-display" id="codeDisplay">
            <div>🎯 <strong>Code de Jumelage:</strong></div>
            <div class="code-text" id="pairingCode"></div>
            <div style="margin-top: 10px; font-size: 14px; color: #666;">
              Saisissez ce code dans WhatsApp
            </div>
          </div>
          
          <div class="links">
            <a href="/status" target="_blank">📊 Statut</a>
            <a href="/health" target="_blank">🏥 Santé</a>
          </div>
        </div>

        <script>
          // Vérification du statut au chargement
          checkStatus();
          setInterval(checkStatus, 10000); // Vérifier toutes les 10 secondes

          async function checkStatus() {
            try {
              const response = await fetch('/status');
              const data = await response.json();
              const statusDiv = document.getElementById('status');
              
              if (data.status === 'connected') {
                statusDiv.className = 'status connected';
                statusDiv.innerHTML = '🟢 Bot connecté et prêt';
              } else {
                statusDiv.className = 'status disconnected';
                statusDiv.innerHTML = '🔴 Bot déconnecté';
              }
            } catch (error) {
              const statusDiv = document.getElementById('status');
              statusDiv.className = 'status disconnected';
              statusDiv.innerHTML = '⚠️ Erreur de connexion';
            }
          }

          async function requestPairingCode() {
            const phoneInput = document.getElementById('phoneNumber');
            const phone = phoneInput.value.trim();
            
            // Validation du numéro
            if (!phone.match(/^\\+\\d{8,15}$/)) {
              alert('❌ Format invalide!\\n\\nUtilisez le format: +225XXXXXXXX\\nExemple: +22507123456');
              phoneInput.focus();
              return;
            }

            const btn = document.getElementById('pairBtn');
            const loading = document.getElementById('loading');
            const codeDisplay = document.getElementById('codeDisplay');
            
            // Animation de chargement
            btn.disabled = true;
            btn.textContent = '⏳ Génération du code...';
            loading.style.display = 'block';
            codeDisplay.style.display = 'none';

            try {
              const response = await fetch('/pairing-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone })
              });

              const data = await response.json();
              
              if (data.success && data.pairingCode) {
                document.getElementById('pairingCode').textContent = data.pairingCode;
                codeDisplay.style.display = 'block';
                btn.textContent = '✅ Code généré!';
                
                // Sélectionner le code automatiquement
                setTimeout(() => {
                  const codeElement = document.getElementById('pairingCode');
                  if (window.getSelection) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(codeElement);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }, 500);
                
              } else {
                throw new Error(data.message || 'Erreur inconnue');
              }
            } catch (error) {
              alert('❌ Erreur: ' + error.message);
              btn.textContent = '❌ Erreur - Réessayer';
            } finally {
              loading.style.display = 'none';
              setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '📱 Obtenir le Code de Jumelage';
              }, 3000);
            }
          }

          // Validation en temps réel
          document.getElementById('phoneNumber').addEventListener('input', function(e) {
            let value = e.target.value;
            // Supprimer tout sauf les chiffres et le +
            value = value.replace(/[^+0-9]/g, '');
            // S'assurer que ça commence par +
            if (value && !value.startsWith('+')) {
              value = '+' + value;
            }
            e.target.value = value;
          });

          // Entrée pour déclencher la demande
          document.getElementById('phoneNumber').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              requestPairingCode();
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    log(`❌ Erreur interface: ${error.message}`, 'error');
    res.status(500).send('<h1>Erreur serveur</h1>');
  }
});

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

    // Nettoyer le numéro (supprimer tout sauf les chiffres)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    if (cleanNumber.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Numéro de téléphone invalide' 
      });
    }

    log(`📱 Demande de code pour: ${phoneNumber}`, 'info');

    if (!sock) {
      return res.status(503).json({ 
        success: false, 
        message: 'Bot non initialisé' 
      });
    }

    // Attendre 3 secondes
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Demander le code de jumelage
    const code = await sock.requestPairingCode(cleanNumber);
    
    if (code) {
      // Formatage du code avec tirets (XXXX-XXXX)
      const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
      
      // Utiliser le code personnalisé si défini
      const customCode = process.env.CUSTOM_PAIRING_CODE || 'VCFBOT24';
      const finalCode = customCode;
      
      log(`✅ Code généré: ${finalCode}`, 'success');
      
      res.json({ 
        success: true, 
        pairingCode: finalCode,
        originalCode: formattedCode
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Impossible de générer le code' 
      });
    }

  } catch (error) {
    log(`❌ Erreur génération code: ${error.message}`, 'error');
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Route de statut
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    lastConnected: lastConnected,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'VCF Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    connection: connectionStatus
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  log(`🌐 Serveur démarré sur le port ${PORT}`, 'success');
  log(`📱 Interface: http://localhost:${PORT}`, 'info');
  
  // Démarrer le bot WhatsApp
  startBot();
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  log('👋 Arrêt du bot...', 'warning');
  if (sock) {
    sock.end();
  }
  process.exit(0);
});
