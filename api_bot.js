// GME-1: ARES Protocol Group Management and Enforcement Utility (whatsapp-web.js version)
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

const COMMAND_PREFIX = "!"; // Enforce a strict command prefix

// --- NEW GLOBAL STATE & CONFIGURATION ---
let downtimeProtocolActive = false; // Tracks the "Out of Office" status
const ownerNumber = "2349021503942@c.us";
const downtimeMessage = "📢 **DOWNTIME PROTOCOL ACTIVE**. The primary operator is currently deployed on an external mission and is unavailable for direct communication. Your query has been logged. Expect a response upon return to base. Do not transmit further data.";


// Initialize the Client with persistent session storage
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "ares_gme_1" }), 
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable', 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-gpu'
        ], 
    }
});

// 1. DATA ARRAY: Core Maxims
const MAXIMS = [
    "Discipline is the soul of an army. It makes small numbers formidable; procures success to the weak.",
    "Authority is not given, it is taken. Respect is earned through execution.",
    "A chain is only as strong as its weakest link. Eliminate the breach.",
    "Precision in command ensures swiftness in response. Utilize the protocol.",
    "The mission is absolute. Personal chatter is a systemic vulnerability.",
];


// --- CONNECTION AND AUTHENTICATION PROTOCOL ---

client.on('qr', (qr) => {
    // Display the QR code in the terminal for scanning
    console.log('SCAN REQUIRED: Execute this QR code on your WhatsApp mobile application.');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("ARES GME-1 PROTOCOL: CONNECTION SECURE. Operational Status: 100%");
});

client.on('authenticated', () => {
    console.log('AUTHENTICATION SUCCESSFUL. Credentials established.');
});

client.on('auth_failure', msg => {
    // Fired if the terminal/device is logged out
    console.error('AUTHENTICATION FAILURE:', msg);
});

// --- ENFORCEMENT AND UTILITY PROTOCOL ---

client.on('message_create', async (msg) => {
    // Check if the message is from the owner and if the bot has sent it
    if (msg.fromMe && !msg.body.startsWith(COMMAND_PREFIX)) return; // Ignore messages the bot sends that aren't commands

    const chat = await msg.getChat();
    const isGroup = chat.isGroup;
    const text = msg.body;
    const sender = msg.from;
    const isOwner = sender === ownerNumber; // New check for owner

    // --- NEW: DOWNTIME PROTOCOL INTERCEPT (For Private Chats) ---
    // If the Downtime Protocol is active, respond to ALL non-command PRIVATE messages.
    if (!isGroup && downtimeProtocolActive && !text.startsWith(COMMAND_PREFIX)) {
        // Send the auto-reply, but only if the sender is not the owner (to avoid a loop)
        if (!isOwner) {
            return msg.reply(downtimeMessage);
        }
    }
    // --- END DOWNTIME PROTOCOL INTERCEPT ---

    // Skip if not a command
    if (!text.startsWith(COMMAND_PREFIX)) return;

    // Parse command
    const args = text.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    const commandText = args.join(" ");

    // --- RE-ENGINEERED: CONTEXT-BASED CLEARANCE CHECK (FIX FOR TypeError) ---
    let isSenderAdmin = false;
    let isBotAdmin = false;
    
    // Only check admin status if the message originated in a group
    if (isGroup) {
        // chat.getParticipants() is the correct and robust way to check status in whatsapp-web.js
        try {
            const participants = await chat.getParticipants(); 
            
            // Find the sender and the bot in the participant list
            const senderParticipant = participants.find(p => p.id._serialized === (msg.author || msg.from));
            const botParticipant = participants.find(p => p.id._serialized === client.info.wid._serialized);
            
            // Set clearance flags safely
            if (senderParticipant) {
                isSenderAdmin = senderParticipant.isAdmin;
            }
            if (botParticipant) {
                isBotAdmin = botParticipant.isAdmin;
            }
        } catch (e) {
            console.error("Error retrieving group participants:", e);
            // Treat as non-admin if retrieval fails
            isSenderAdmin = false;
            isBotAdmin = false;
        }
    }
    // --- END RE-ENGINEERED CLEARANCE CHECK ---


    // --- OWNER-ONLY COMMANDS (PERSONAL CLEARANCE) ---
    if (isOwner) {
        switch (command) {
            case "downtime":
                if (commandText.toLowerCase() === 'on') {
                    downtimeProtocolActive = true;
                    msg.reply("✅ **DOWNTIME PROTOCOL INITIATED**. All non-essential communications will now receive automated response.");
                } else if (commandText.toLowerCase() === 'off') {
                    downtimeProtocolActive = false;
                    msg.reply("✅ **DOWNTIME PROTOCOL DEACTIVATED**. Direct communication channel is now open.");
                } else {
                    msg.reply(`⚠️ **SYNTAX ERROR**. Use: !downtime [on|off]. Current Status: ${downtimeProtocolActive ? 'ACTIVE' : 'INACTIVE'}`);
                }
                return; // Owner commands complete the execution flow
        }
    }

    // --- ENFORCEMENT PROTOCOL (Group Admin Commands) ---
    // Note: These must be skipped if not in a group
    if (isGroup && isBotAdmin) {
        switch (command) {
            case "kick":
            case "terminate": 
                if (!isSenderAdmin) return msg.reply("🚫 **ACCESS DENIED**. Admin clearance required.");
                const mentioned = msg.mentions;
                if (mentioned.length > 0) {
                    try {
                        const targetId = mentioned[0].id._serialized;
                        await chat.removeParticipants([targetId]);
                        msg.reply(`✅ **TERMINATION COMPLETE**. Target ${mentioned[0].id.user} removed from the unit.`);
                    } catch (e) {
                        msg.reply("❌ **PROTOCOL FAILURE**. Unable to execute removal command. Target may be immune.");
                    }
                } else {
                    msg.reply("⚠️ **SYNTAX ERROR**. Target must be mentioned. Use: !kick @user");
                }
                return;

            case "demote":
            case "strip": 
                if (!isSenderAdmin) return msg.reply("🚫 **ACCESS DENIED**. Admin clearance required.");
                const demoteMentioned = msg.mentions;
                if (demoteMentioned.length > 0) {
                    try {
                        const targetId = demoteMentioned[0].id._serialized;
                        await chat.demoteParticipants([targetId]);
                        msg.reply(`⬇️ **RANK STRIPPED**. User ${demoteMentioned[0].id.user} reduced to standard personnel.`);
                    } catch (e) {
                        msg.reply("❌ **PROTOCOL FAILURE**. Unable to execute demotion command.");
                    }
                } else {
                    msg.reply("⚠️ **SYNTAX ERROR**. Target must be mentioned. Use: !demote @user");
                }
                return;

            case "promote":
            case "elevate": 
                if (!isSenderAdmin) return msg.reply("🚫 **ACCESS DENIED**. Admin clearance required.");
                const promoteMentioned = msg.mentions;
                if (promoteMentioned.length > 0) {
                    try {
                        const targetId = promoteMentioned[0].id._serialized;
                        await chat.promoteParticipants([targetId]);
                        msg.reply(`⬆️ **RANK ELEVATED**. User ${promoteMentioned[0].id.user} granted administrative clearance.`);
                    } catch (e) {
                        msg.reply("❌ **PROTOCOL FAILURE**. Unable to execute elevation command.");
                    }
                } else {
                    msg.reply("⚠️ **SYNTAX ERROR**. Target must be mentioned. Use: !promote @user");
                    return;
                }
                return;
            
            case "subject":
            case "rename": 
                if (!isSenderAdmin) return msg.reply("🚫 **ACCESS DENIED**. Admin clearance required.");
                if (commandText) {
                    try {
                        await chat.setSubject(commandText);
                        msg.reply(`✏️ **SUBJECT UPDATED**. New Designation: *${commandText}*`);
                    } catch (e) {
                        msg.reply("❌ **PROTOCOL FAILURE**. Subject update denied by system.");
                    }
                } else {
                    msg.reply("⚠️ **SYNTAX ERROR**. New subject designation is required. Use: !subject [New Title]");
                }
                return;
        }
    }

    // --- STANDARD UTILITY PROTOCOL (For All Users in Group or Private) ---
    switch (command) {
        case "maxim":
            const maxim = MAXIMS[Math.floor(Math.random() * MAXIMS.length)];
            msg.reply(`📜 **ARES MAXIM**:\n\n*${maxim}*`);
            break;

        case "ping":
        case "status":
            let statusMode = "STANDARD";
            if (isOwner) statusMode = "OWNER";
            else if (isGroup && isBotAdmin) statusMode = "ADMIN";
            
            msg.reply(`📡 **ARES GME-1 STATUS**: OPERATIONAL (${statusMode}).\nLatency: Executed in 0.0s. Downtime Protocol: ${downtimeProtocolActive ? 'ACTIVE' : 'INACTIVE'}`);
            break;

        case "protocol":
        case "help":
            const adminProtocol = `*ADMINISTRATION (Group Admin/Bot Admin):*\n` +
                                `${COMMAND_PREFIX}kick / ${COMMAND_PREFIX}terminate @user\n` +
                                `${COMMAND_PREFIX}promote / ${COMMAND_PREFIX}elevate @user\n` +
                                `${COMMAND_PREFIX}demote / ${COMMAND_PREFIX}strip @user\n` +
                                `${COMMAND_PREFIX}subject [Title] / ${COMMAND_PREFIX}rename [Title]`;

            const ownerProtocol = `*OWNER ONLY (Private Chat):*\n` +
                                `${COMMAND_PREFIX}downtime [on|off] - Toggles auto-reply for private messages.`;

            const userProtocol = `*UTILITY (All Personnel):*\n` +
                                `${COMMAND_PREFIX}maxim - Core tactical maxim.\n` +
                                `${COMMAND_PREFIX}status - Operational status.\n` +
                                `${COMMAND_PREFIX}protocol - This manifest.`;
                                
            msg.reply(`👑 **ARES PROTOCOL MANIFEST** 👑\n\n${ownerProtocol}\n\n${adminProtocol}\n\n${userProtocol}`);
            break;
    }
});

// --- UNIT ROSTER MANAGEMENT (Welcome/Goodbye) ---
client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const participantId = notification.recipientIds[0];
    
    // Check if the bot is admin using the correct method
    let botIsAdmin = false;
    try {
        const participants = await chat.getParticipants();
        const botParticipant = participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (botParticipant) {
            botIsAdmin = botParticipant.isAdmin;
        }
    } catch (e) {
        console.error("Error checking bot admin status on group join:", e);
    }

    if (!botIsAdmin) return;
    
    // Convert ID to a proper mention
    const participant = await client.getContactById(participantId);
    
    const msg = `📢 **NOTICE**: New unit personnel detected. *Welcome, Agent @${participant.id.user}*. Review the protocol: ${COMMAND_PREFIX}protocol`;
    chat.sendMessage(msg, {
        mentions: [participant]
    });
});

client.on('group_leave', async (notification) => {
    const chat = await notification.getChat();
    const participantId = notification.recipientIds[0];
    
    // Check if the bot is admin using the correct method
    let botIsAdmin = false;
    try {
        const participants = await chat.getParticipants();
        const botParticipant = participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (botParticipant) {
            botIsAdmin = botParticipant.isAdmin;
        }
    } catch (e) {
        console.error("Error checking bot admin status on group leave:", e);
    }

    if (!botIsAdmin) return;
    
    // Convert ID to a proper mention
    const participant = await client.getContactById(participantId);

    const msg = `⚠️ **UNIT DISBANDMENT**: Agent @${participant.id.user} has detached from the current roster. Record updated.`;
    chat.sendMessage(msg, {
        mentions: [participant]
    });
});

// --- START THE MACHINE ---
client.initialize();