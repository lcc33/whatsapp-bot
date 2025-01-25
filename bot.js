const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require("@whiskeysockets/baileys");
const fs = require("fs");
const qrcode = require('qrcode-terminal');

const store = makeInMemoryStore({});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Admin-Only Bot", "Chrome", "1.0.0"],
    });

    store.bind(sock.ev);

    // Function to check if the bot is an admin
    async function isBotAdmin(groupId) {
        try {
            const metadata = await sock.groupMetadata(groupId);
            const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
            return metadata.participants.some((participant) => participant.id === botNumber && participant.admin);
        } catch (err) {
            console.error("Error fetching group metadata:", err);
            return false;
        }
    }

    // Function to get group admins
    async function getGroupAdmins(groupId) {
        try {
            const metadata = await sock.groupMetadata(groupId);
            return metadata.participants
                .filter((participant) => participant.admin)
                .map((participant) => participant.id);
        } catch (err) {
            console.error("Error fetching group metadata:", err);
            return [];
        }
    }

    // Listen for new messages
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.remoteJid || msg.key.fromMe) return;

        const chatId = msg.key.remoteJid;

        // Check if the message is in a group
        if (chatId.endsWith("@g.us")) {
            const botIsAdmin = await isBotAdmin(chatId);
            if (!botIsAdmin) return; // Exit if the bot is not an admin

            const admins = await getGroupAdmins(chatId);

            // Warn users posting links (excluding admins and bot owner)
            if (
                msg.message?.conversation?.includes("http") ||
                msg.message?.conversation?.includes("www")
            ) {
                const sender = msg.key.participant || msg.key.remoteJid;
                if (!admins.includes(sender)) {
                    const warningMessage = `⚠️ Warning: Please avoid sharing links in this group!`;
                    await sock.sendMessage(chatId, { text: warningMessage });
                }
            }
        }
    });

    // Handle new participants in the group
    sock.ev.on("group-participants.update", async (update) => {
        if (update.action === "add") {
            const botIsAdmin = await isBotAdmin(update.id);
            if (!botIsAdmin) return; // Exit if the bot is not an admin

            const welcomeMessage = `👋 Welcome, @${update.participants[0].split("@")[0]}! Please introduce yourself and enjoy the group.`;
            await sock.sendMessage(update.id, {
                text: welcomeMessage,
                mentions: update.participants,
            });
        }
    });

    // Handle connection updates
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed. Reconnecting...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("Bot connected successfully!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    
}


startBot();
