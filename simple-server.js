const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

console.log('Démarrage du serveur simple...');

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>VCF Bot - Test</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; 
               background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .container { background: white; color: black; padding: 30px; 
                     border-radius: 15px; max-width: 400px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 VCF Bot</h1>
        <p>Interface de test fonctionnelle !</p>
        <div style="margin: 20px 0;">
          <input type="tel" id="phone" placeholder="+225XXXXXXXX" style="padding: 10px; width: 200px;">
          <br><br>
          <button onclick="testPairing()" style="padding: 10px 20px; background: #25D366; color: white; border: none; border-radius: 5px;">
            Tester le Code
          </button>
        </div>
        <div id="result" style="margin-top: 20px;"></div>
      </div>
      <script>
        function testPairing() {
          const phone = document.getElementById('phone').value;
          if (phone) {
            document.getElementById('result').innerHTML = 
              '<div style="background: #e8f5e8; padding: 15px; border-radius: 8px; color: #2e7d32; font-weight: bold;">Code: VCFBOT24</div>';
          } else {
            alert('Veuillez entrer un numéro');
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/status', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Accès: http://localhost:${PORT}`);
});
