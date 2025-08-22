const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

console.log('🚀 Démarrage du serveur VCF Bot...');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Route principale avec interface intégrée
app.get('/', (req, res) => {
  console.log('📱 Accès à l\'interface web principale');
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🤖 VCF Bot - Interface de Connexion</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        p { color: #666; margin-bottom: 30px; font-size: 16px; }
        .input-group { margin: 25px 0; }
        input { 
          padding: 15px; width: 100%; border: 2px solid #e0e0e0; border-radius: 10px; 
          font-size: 16px; transition: all 0.3s ease;
        }
        input:focus { outline: none; border-color: #25D366; box-shadow: 0 0 10px rgba(37,211,102,0.3); }
        button { 
          background: linear-gradient(135deg, #25D366, #20b358); color: white; border: none; 
          padding: 15px 30px; border-radius: 10px; font-size: 16px; font-weight: bold;
          cursor: pointer; width: 100%; margin-top: 10px; transition: all 0.3s ease;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(37,211,102,0.4); }
        .result { 
          background: linear-gradient(135deg, #e8f5e8, #f1f8e9); border: 2px solid #8bc34a; 
          border-radius: 15px; padding: 20px; margin: 20px 0; font-size: 24px; 
          font-weight: bold; color: #2e7d32; display: none; letter-spacing: 2px;
        }
        .links { margin-top: 30px; }
        .links a { 
          color: #25D366; text-decoration: none; margin: 0 15px; 
          padding: 8px 15px; border-radius: 20px; transition: all 0.3s ease;
        }
        .links a:hover { background: #25D366; color: white; }
        .status { margin-top: 20px; padding: 10px; border-radius: 10px; font-size: 14px; }
        .status.online { background: #e8f5e8; color: #2e7d32; }
        .status.offline { background: #ffebee; color: #c62828; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🤖</div>
        <h1>VCF Bot</h1>
        <p>Interface de Connexion WhatsApp</p>
        
        <div class="input-group">
          <input type="tel" id="phone" placeholder="+225XXXXXXXX" maxlength="15">
        </div>
        
        <button onclick="getPairingCode()">🔗 Obtenir le Code de Jumelage</button>
        
        <div id="result" class="result"></div>
        
        <div class="status online">🟢 Serveur en ligne</div>
        
        <div class="links">
          <a href="/status" target="_blank">📊 Statut</a>
          <a href="/health" target="_blank">💚 Santé</a>
        </div>
      </div>

      <script>
        async function getPairingCode() {
          const phone = document.getElementById('phone').value.trim();
          const resultDiv = document.getElementById('result');
          
          // Validation du numéro
          if (!phone) {
            alert('❌ Veuillez entrer un numéro de téléphone');
            return;
          }
          
          if (!phone.match(/^\\+\\d{8,15}$/)) {
            alert('❌ Format invalide. Utilisez +225XXXXXXXX (8-15 chiffres)');
            return;
          }
          
          try {
            // Simulation du code de jumelage (remplacer par l'API réelle)
            const code = "VCFBOT24";
            
            resultDiv.innerHTML = '📱 Code de Jumelage: ' + code;
            resultDiv.style.display = 'block';
            
            // Animation
            resultDiv.style.animation = 'slideUp 0.5s ease-out';
            
          } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de la génération du code: ' + error.message);
          }
        }

        // Vérification du statut du serveur
        async function checkStatus() {
          try {
            const response = await fetch('/status');
            const data = await response.json();
            console.log('✅ Statut du serveur:', data);
          } catch (error) {
            console.log('⚠️ Erreur de connexion au serveur');
          }
        }

        // Vérifier le statut au chargement
        checkStatus();
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
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    health: 'OK',
    service: 'VCF WhatsApp Bot',
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
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 VCF Bot démarré avec succès !`);
  console.log(`🌐 Interface web: http://localhost:${PORT}`);
  console.log(`📊 Statut: http://localhost:${PORT}/status`);
  console.log(`💚 Santé: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
  console.log(`📱 Port: ${PORT}`);
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`);
});
