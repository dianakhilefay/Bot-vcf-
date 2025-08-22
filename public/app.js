// Configuration de l'application
const config = {
    serverUrl: window.location.origin,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    checkStatusInterval: 10000
};

// État de l'application
let appState = {
    isConnected: false,
    isConnecting: false,
    pairingMode: false,
    reconnectAttempts: 0
};

// Éléments DOM
const elements = {
    status: document.getElementById('status'),
    qrSection: document.getElementById('qr-section'),
    instructions: document.getElementById('instructions'),
    pairingSection: document.getElementById('pairing-section'),
    pairingCodeDisplay: document.getElementById('pairingCodeDisplay'),
    phoneNumber: document.getElementById('phoneNumber'),
    refreshBtn: document.getElementById('refreshBtn'),
    pairingBtn: document.getElementById('pairingBtn'),
    qrcode: document.getElementById('qrcode'),
    botVersion: document.getElementById('botVersion')
};

// Classes CSS pour les différents états
const statusClasses = {
    connecting: 'status connecting',
    connected: 'status connected',
    disconnected: 'status disconnected'
};

// Messages d'état
const statusMessages = {
    initializing: '🔄 Initialisation du bot...',
    serverConnecting: '🔄 Connexion au serveur...',
    serverConnected: '🔄 Serveur connecté, initialisation WhatsApp...',
    whatsappConnecting: '🔄 Connexion à WhatsApp en cours...',
    qrGenerating: '🔄 Génération du QR Code...',
    pairingCodeGenerating: '🔄 Génération du code de jumelage...',
    pairingCodeGenerated: '🔢 Code de jumelage généré ! Entrez-le dans WhatsApp',
    pairingModeActive: '🔢 Mode code de jumelage activé',
    connected: '✅ WhatsApp connecté et prêt !',
    disconnected: '❌ WhatsApp déconnecté',
    serverUnavailable: '❌ Serveur indisponible',
    serverError: '❌ Impossible de se connecter au serveur',
    whatsappError: '❌ Erreur d\'initialisation WhatsApp',
    qrError: '❌ Erreur lors de la génération du QR code',
    pairingError: '❌ Erreur de génération du code',
    refreshing: '🔄 Actualisation de la connexion...'
};

// Initialisation de l'application
class WhatsAppBotInterface {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation de l\'interface du bot WhatsApp');
        this.updateStatus('connecting', statusMessages.initializing);
        
        // Attendre que le DOM soit complètement chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        this.setupEventListeners();
        await this.checkServerStatus();
        this.startPeriodicStatusCheck();
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        console.log('📡 Configuration des écouteurs d\'événements');

        // Bouton d'actualisation
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', () => this.refreshConnection());
        }

        // Bouton de basculement mode jumelage
        if (elements.pairingBtn) {
            elements.pairingBtn.addEventListener('click', () => this.togglePairingMode());
        }

        // Input numéro de téléphone
        if (elements.phoneNumber) {
            elements.phoneNumber.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.requestPairingCode();
                }
            });

            // Validation en temps réel du numéro
            elements.phoneNumber.addEventListener('input', (e) => {
                this.validatePhoneNumber(e.target.value);
            });
        }

        // Gestion de la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkConnectionStatus();
            }
        });

        // Gestion des erreurs globales
        window.addEventListener('error', (e) => {
            console.error('💥 Erreur JavaScript:', e.error);
        });

        console.log('✅ Écouteurs d\'événements configurés');
    }

    // Vérification du statut du serveur
    async checkServerStatus() {
        console.log('🔍 Vérification du statut du serveur');
        this.updateStatus('connecting', statusMessages.serverConnecting);

        try {
            const response = await fetch('/health', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📊 Statut du serveur:', data);

            if (data.status === 'healthy') {
                this.updateStatus('connecting', statusMessages.serverConnected);
                appState.reconnectAttempts = 0;
                
                // Mettre à jour la version du bot
                if (elements.botVersion && data.version) {
                    elements.botVersion.textContent = data.version;
                }

                await this.initializeWhatsApp();
            } else {
                this.updateStatus('disconnected', statusMessages.serverUnavailable);
                this.scheduleReconnect();
            }
        } catch (error) {
            console.error('❌ Erreur de connexion au serveur:', error);
            this.updateStatus('disconnected', statusMessages.serverError);
            this.scheduleReconnect();
        }
    }

    // Planifier une tentative de reconnexion
    scheduleReconnect() {
        if (appState.reconnectAttempts < config.maxReconnectAttempts) {
            appState.reconnectAttempts++;
            console.log(`🔄 Tentative de reconnexion ${appState.reconnectAttempts}/${config.maxReconnectAttempts}`);
            setTimeout(() => this.checkServerStatus(), config.reconnectInterval);
        } else {
            console.log('❌ Nombre maximum de tentatives de reconnexion atteint');
            this.updateStatus('disconnected', '❌ Impossible de se connecter après plusieurs tentatives');
        }
    }

    // Initialisation de la connexion WhatsApp
    async initializeWhatsApp() {
        console.log('📱 Initialisation de la connexion WhatsApp');
        
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            console.log('📊 Statut WhatsApp:', data);

            if (data.isConnected) {
                this.handleConnectionSuccess();
            } else {
                this.requestQrCode();
            }
        } catch (error) {
            console.error('❌ Erreur d\'initialisation WhatsApp:', error);
            this.updateStatus('disconnected', statusMessages.whatsappError);
        }
    }

    // Demander un QR code
    async requestQrCode() {
        console.log('📱 Demande de QR code');
        this.updateStatus('connecting', statusMessages.qrGenerating);
        this.showQrSection();
        
        try {
            // Afficher un placeholder pendant la génération
            this.showQrPlaceholder();
            this.showInstructions();
            
            // Simuler la génération du QR code
            // Dans une vraie implémentation, cela viendrait du serveur
            setTimeout(() => {
                console.log('✅ QR code généré (simulé)');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erreur lors de la génération du QR code:', error);
            this.updateStatus('disconnected', statusMessages.qrError);
        }
    }

    // Afficher un placeholder de QR code
    showQrPlaceholder() {
        if (elements.qrSection) {
            elements.qrSection.innerHTML = `
                <div style="width: 250px; height: 250px; background: #f0f0f0; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; border-radius: 10px; margin: 0 auto;">
                    <div style="text-align: center; color: #666;">
                        <div style="font-size: 60px; margin-bottom: 10px;">📱</div>
                        <p>QR Code WhatsApp</p>
                        <p style="font-size: 12px;">Scannez avec WhatsApp</p>
                    </div>
                </div>
                <p style="margin-top: 15px; color: #666;">Scannez ce QR code avec WhatsApp</p>
            `;
        }
    }

    // Demander un code de jumelage
    async requestPairingCode() {
        const phoneNumber = elements.phoneNumber?.value.trim();
        
        console.log('🔢 Demande de code de jumelage pour:', phoneNumber);

        if (!phoneNumber) {
            this.showAlert('Veuillez entrer votre numéro de téléphone', 'warning');
            return;
        }

        if (!this.isValidPhoneNumber(phoneNumber)) {
            this.showAlert('Format invalide. Utilisez le format international (+225XXXXXXXX)', 'error');
            return;
        }

        try {
            this.updateStatus('connecting', statusMessages.pairingCodeGenerating);
            
            const response = await fetch('/pairing-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber })
            });

            const data = await response.json();
            console.log('📊 Réponse code de jumelage:', data);
            
            if (data.pairingCode) {
                this.showPairingCode(data.pairingCode);
                this.updateStatus('connecting', statusMessages.pairingCodeGenerated);
            } else {
                this.updateStatus('disconnected', statusMessages.pairingError);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la génération du code de jumelage:', error);
            this.updateStatus('disconnected', statusMessages.pairingError);
        }
    }

    // Valider le format du numéro de téléphone
    isValidPhoneNumber(phoneNumber) {
        return /^\+\d{8,}$/.test(phoneNumber);
    }

    // Validation en temps réel du numéro
    validatePhoneNumber(phoneNumber) {
        if (elements.phoneNumber) {
            if (phoneNumber && !this.isValidPhoneNumber(phoneNumber)) {
                elements.phoneNumber.style.borderColor = '#dc3545';
            } else {
                elements.phoneNumber.style.borderColor = '#28a745';
            }
        }
    }

    // Afficher le code de jumelage
    showPairingCode(code) {
        console.log('🔢 Affichage du code de jumelage:', code);
        if (elements.pairingCodeDisplay) {
            elements.pairingCodeDisplay.textContent = code;
            elements.pairingCodeDisplay.classList.remove('hidden');
        }
    }

    // Basculer entre mode QR et mode code de jumelage
    togglePairingMode() {
        appState.pairingMode = !appState.pairingMode;
        console.log('🔄 Basculement mode jumelage:', appState.pairingMode);
        
        if (appState.pairingMode) {
            this.showPairingSection();
            this.hidePairingSection();
            this.hideInstructions();
            this.updateButtonText(elements.pairingBtn, '📱 Mode QR Code');
            this.updateStatus('connecting', statusMessages.pairingModeActive);
        } else {
            this.hidePairingSection();
            this.showQrSection();
            this.updateButtonText(elements.pairingBtn, '🔢 Mode Code de Jumelage');
            this.requestQrCode();
        }
    }

    // Actualiser la connexion
    refreshConnection() {
        console.log('🔄 Actualisation de la connexion');
        this.updateStatus('connecting', statusMessages.refreshing);
        this.hidePairingCode();
        appState.reconnectAttempts = 0;
        this.checkServerStatus();
    }

    // Vérifier périodiquement le statut de connexion
    async checkConnectionStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            // Connexion établie
            if (data.isConnected && !appState.isConnected) {
                console.log('✅ WhatsApp connecté avec succès');
                this.handleConnectionSuccess();
            } 
            // Connexion perdue
            else if (!data.isConnected && appState.isConnected) {
                console.log('❌ WhatsApp déconnecté');
                this.handleConnectionLoss();
            }
        } catch (error) {
            // Ignorer les erreurs de vérification silencieuses pour éviter le spam
            console.debug('🔍 Erreur de vérification du statut (ignorée):', error.message);
        }
    }

    // Gérer le succès de connexion
    handleConnectionSuccess() {
        appState.isConnected = true;
        this.updateStatus('connected', statusMessages.connected);
        this.hideQrSection();
        this.hidePairingSection();
        this.hideInstructions();
    }

    // Gérer la perte de connexion
    handleConnectionLoss() {
        appState.isConnected = false;
        this.updateStatus('disconnected', statusMessages.disconnected);
        this.showQrSection();
    }

    // Démarrer la vérification périodique du statut
    startPeriodicStatusCheck() {
        console.log('⏰ Démarrage de la vérification périodique du statut');
        setInterval(() => this.checkConnectionStatus(), config.checkStatusInterval);
    }

    // Méthodes utilitaires pour l'interface utilisateur
    updateStatus(type, message) {
        if (elements.status) {
            elements.status.className = statusClasses[type];
            elements.status.textContent = message;
        }
        console.log(`📊 Statut mis à jour: ${type} - ${message}`);
    }

    showQrSection() {
        this.toggleElement(elements.qrSection, true);
    }

    hideQrSection() {
        this.toggleElement(elements.qrSection, false);
    }

    showPairingSection() {
        this.toggleElement(elements.pairingSection, true);
    }

    hidePairingSection() {
        this.toggleElement(elements.pairingSection, false);
    }

    showInstructions() {
        this.toggleElement(elements.instructions, true);
    }

    hideInstructions() {
        this.toggleElement(elements.instructions, false);
    }

    hidePairingCode() {
        this.toggleElement(elements.pairingCodeDisplay, false);
    }

    toggleElement(element, show) {
        if (element) {
            if (show) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    }

    updateButtonText(button, text) {
        if (button) {
            button.textContent = text;
        }
    }

    showAlert(message, type = 'info') {
        console.log(`🚨 Alerte ${type}: ${message}`);
        alert(message); // Pour l'instant, utiliser alert simple
        // TODO: Implémenter un système de notifications plus élégant
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM prêt, initialisation de l\'interface');
    new WhatsAppBotInterface();
});

// Export pour utilisation dans d'autres modules si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppBotInterface;
}
