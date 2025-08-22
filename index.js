import { watchFile, unwatchFile } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import express from 'express';
import cors from 'cors';
import moment from 'moment-timezone';
import P from 'pino';
import { Boom } from '@hapi/boom';
import {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBazelVersion,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  proto,
  getContentType,
  downloadContentFromMessage,
  jidDecode
} from '@whiskeysockets/baileys';

const { chain } = lodash;
const PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let store = {};
let sessionSockets = {};

function decodeJid(jid) {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    let decode = jidDecode(jid) || {};
    return decode.user && decode.server && decode.user + '@' + decode.server || jid;
  } else return jid;
}

// Import des utilitaires storage
import { storage } from './utils/storage.js';
import { connectDB } from './utils/connectDB.js';
import { User } from './models/user.js';

// Plugin de statistiques uniquement
let plugins = {};
const loadPlugins = async () => {
  const pluginFiles = readdirSync("./plugins");
  for (const file of pluginFiles) {
    if (file.endsWith(".js")) {
      try {
        const filePath = path.resolve("./plugins", file);
        const pluginModule = await import(filePath);
        
        if (pluginModule.command && typeof pluginModule.execute === "function") {
          pluginModule.command.forEach(command => {
            plugins[command] = pluginModule.execute;
            console.log("✅ Loaded command: " + command);
          });
        }
      } catch (error) {
        console.error("❌ Error loading plugin " + file + ":", error);
      }
    }
  }
};

async function createBot(sessionId) {
  try {
    await connectDB();
    await storage.initPostgreSQL(User);
  } catch (error) {
    console.log("Database connection failed, continuing with fallback storage");
  }

  try {
    const sessionPath = "./sessions/" + sessionId;
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const client = makeWASocket({
      logger: P({ level: "fatal" }).child({ level: "fatal" }),
      printQRInTerminal: false,
      browser: ["VCF Bot", "Chrome", "121.0.6167.159"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, P({ level: "fatal" }).child({ level: "fatal" })),
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        if (store) {
          const message = await store.loadMessage(key.remoteJid, key.id);
          return message.message || undefined;
        }
        return { conversation: "VCF Bot Message" };
      },
    });

    sessionSockets[sessionId] = client;

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log("Connection lost, attempting to reconnect...");
          setTimeout(() => createBot(sessionId), 5000);
        } else {
          console.log(sessionId + " Logged out.");
          delete sessionSockets[sessionId];
        }
      } else if (connection === "open") {
        console.log("😃 VCF Bot Connected Successfully ✅");

        try {
          await loadPlugins();
          console.log("Plugins loaded: statistiques");

          const existingUser = await storage.findUser(sessionId);
          if (!existingUser) {
            const newUser = { sessionId: sessionId };
            await storage.createUser(sessionId, newUser);
            console.log("👤 New user created for phone number: " + sessionId);
          }

          const userSettings = await storage.getUserWithDefaults(sessionId);
          if (userSettings) {
            const botName = process.env.BOT_NAME || "VCF BOT";
            const botVersion = process.env.BOT_VERSION || "1.0.0";
            const message = {
              text: `*✅ VCF Bot Connected Successfully!*\n\n*🤖 Bot:* ${botName}\n*📱 Version:* ${botVersion}\n*📊 Plugin:* Statistiques (.stat)\n\n*💬 Ready to serve VCF Generator users!*`
            };
            await client.sendMessage(client.user.id, message);
          }
        } catch (error) {
          console.error("Error during connection setup:", error);
        }
      }
    });

    client.ev.on("creds.update", saveCreds);

    client.ev.on("messages.upsert", async (eventData) => {
      try {
        let m = eventData.messages[0];
        if (!m || !m.message || !m.key) return;
        
        if (!client.user || !client.user.id) {
          console.warn("Client user not properly initialized");
          return;
        }
        
        m.chat = m.key.remoteJid;
        m.sender = m.key.fromMe ? client.user.id.split(":")[0] + "@s.whatsapp.net" : m.key.participant || m.chat;
        m.isFromMe = m.key.fromMe;
        m.isGroup = m.chat && m.chat.endsWith("@g.us");
        m.type = Object.keys(m.message)[0];
        m.contentType = getContentType(m.message);

        m.text = m.contentType === "conversation" ? m.message.conversation :
                 m.contentType === "extendedTextMessage" ? m.message.extendedTextMessage.text :
                 m.contentType === "imageMessage" && m.message.imageMessage.caption ? m.message.imageMessage.caption :
                 m.contentType === "videoMessage" && m.message.videoMessage.caption ? m.message.videoMessage.caption : "";

        const body = typeof m.text === "string" ? m.text : "";
        const userSettings = await storage.getUserWithDefaults(sessionId);

        if (m.message?.["protocolMessage"] || m.message?.["ephemeralMessage"]) return;

        // Prefix et commandes
        m.prefix = userSettings?.["prefix"] || ".";
        m.command = body.startsWith(m.prefix) ? body.slice(m.prefix.length).trim().split(" ").shift().toLowerCase() : "";
        m.args = body.trim().split(/ +/).slice(1);
        m.query = m.args.join(" ");

        const senderId = m.sender ? m.sender.split("@")[0] : "";
        const botId = client.user && client.user.id ? client.user.id.split(":")[0] : "";
        m.isOwner = senderId === botId;

        const reply = async (responseText) => {
          await client.sendMessage(m.chat, { text: responseText }, { quoted: m });
        };

        // Exécution des plugins (statistiques uniquement)
        const plugin = plugins[m.command];
        if (plugin && !m.isFromMe) {
          try {
            const pluginData = {
              phoneNumber: sessionId,
              from: m.chat,
              sender: m.sender,
              fromMe: m.isFromMe,
              isGroup: m.isGroup,
              messageType: m.type,
              quoted: m.quoted,
              pushName: m.pushName || "User",
              prefix: m.prefix,
              command: m.command,
              args: m.args,
              query: m.query,
              isOwner: m.isOwner,
              reply: reply,
            };
            await plugin(client, m, pluginData);
          } catch (error) {
            await reply("❌ Erreur lors de l'exécution de la commande.");
            console.error("Plugin error:", error);
          }
        }

      } catch (error) {
        console.error("Error handling messages:", error);
      }
    });

    return client;
  } catch (error) {
    console.error("Error creating bot:", error);
    throw error;
  }
}

// Endpoint pour recevoir les messages de l'API
app.post("/send-message", async (req, res) => {
  try {
    const { to, message } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    // Vérification de la clé API
    if (process.env.BOT_API_KEY && apiKey !== process.env.BOT_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }

    // Chercher une session connectée
    const sessionIds = Object.keys(sessionSockets);
    if (sessionIds.length === 0) {
      return res.status(503).json({ error: "No bot sessions available" });
    }

    const sessionId = sessionIds[0];
    const client = sessionSockets[sessionId];
    
    if (!client || !client.user) {
      return res.status(503).json({ error: "Bot not connected" });
    }

    // Formater le numéro pour WhatsApp
    const formattedNumber = to.replace(/[^\d]/g, '') + '@s.whatsapp.net';
    
    await client.sendMessage(formattedNumber, { text: message });
    
    console.log(`✅ Message envoyé à ${to}: ${message.substring(0, 50)}...`);
    
    res.json({ 
      success: true, 
      message: "Message sent successfully",
      to: formattedNumber 
    });

  } catch (error) {
    console.error("❌ Error in /send-message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Endpoint de santé
app.get("/health", async (req, res) => {
  try {
    const storageStatus = storage.getStorageStatus ? storage.getStorageStatus() : { status: "unknown" };
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "VCF WhatsApp Bot",
      version: process.env.BOT_VERSION || "1.0.0",
      storage: storageStatus,
      activeConnections: Object.keys(sessionSockets).length,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint pour obtenir le code de jumelage
app.post("/pairing-code", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ status: "Phone number is required" });
    }

    // Générer un code de jumelage simple
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Optionnel: Créer une session pour ce numéro
    setTimeout(() => {
      createBot(phoneNumber.replace(/[^\d]/g, ''));
    }, 1000);

    res.json({
      pairingCode: pairingCode,
      phoneNumber: phoneNumber,
      status: "Pairing code generated successfully"
    });

  } catch (error) {
    console.error("Error in /pairing-code:", error);
    res.status(500).json({ status: "Error generating pairing code" });
  }
});

// Endpoint de statut
app.get("/status", (req, res) => {
  const defaultSession = sessionSockets["default_session"];
  res.json({
    bot: process.env.BOT_NAME || "VCF Bot",
    version: process.env.BOT_VERSION || "1.0.0",
    isConnected: defaultSession ? defaultSession.user !== null : false,
    activeConnections: Object.keys(sessionSockets).length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Route pour l'interface web principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir les fichiers statiques de l'interface web
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, async () => {
  console.log(`🚀 VCF WhatsApp Bot started on port ${PORT}`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 API endpoint: http://localhost:${PORT}/send-message`);
  
  // Créer une session par défaut
  try {
    await createBot("default_session");
  } catch (error) {
    console.error("Error creating default session:", error);
  }
});
