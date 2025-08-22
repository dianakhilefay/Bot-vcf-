// Serveur de test simple pour l'interface web
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes de test
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'simple.html');
  console.log('Serving:', filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error:', err);
      res.status(500).send('<h1>Erreur: ' + err.message + '</h1>');
    }
  });
});

app.get('/status', (req, res) => {
  res.json({
    bot: "VCF Bot",
    version: "1.0.0",
    isConnected: false,
    activeConnections: 0,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/pairing-code', (req, res) => {
  const { phoneNumber } = req.body;
  const pairingCode = 'TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  
  res.json({
    pairingCode,
    phoneNumber,
    status: "Test pairing code generated"
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VCF WhatsApp Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur le port ${PORT}`);
  console.log(`🌐 Interface: http://localhost:${PORT}`);
  console.log(`📁 Dossier public: ${path.join(__dirname, 'public')}`);
  
  try {
    const fs = require('fs');
    const files = fs.readdirSync(path.join(__dirname, 'public'));
    console.log(`📄 Fichiers: ${files.join(', ')}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
});
