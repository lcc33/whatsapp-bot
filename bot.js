const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const qrcode = require("qrcode-terminal");

const store = makeInMemoryStore({});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ["Admin-Only Bot", "Chrome", "1.0.0"],
  });

  store.bind(sock.ev);

  const quotes = [
    "Stay hungry, stay foolish.",
    "Code is like humor. When you have to explain it, it’s bad.",
    "In the middle of difficulty lies opportunity. — Einstein",
    "Im sick of following my dreams, man. Im just going to ask where they are going and hook up with em later.",
    "Gentlemen, you can't fight in here. This is the war room.",
    "Go get a job negro",
    "My mother always used to say: The older you get, the better you get, unless you're a banana.",
    "Clothes make the man. Naked people have little or no influence in society.",
    "I walk around like everything's fine, but deep down, inside my shoe, my sock is sliding off.",
    "I want my children to have all the things I couldn't afford. Then I want to move in with them.",
    "I haven't spoken to my wife in years. I didn't want to interrupt her.",
    "There is no sunrise so beautiful that it is worth waking me up to see it.",
    "Truth hurts. Maybe not as much as jumping on a bicycle with a seat missing, but it hurts.",
    "I never feel more alone than when I'm trying to put sunscreen on my back.",
    "Common sense is like deodorant. The people who need it most never use it.",
  ];

  const quiz = [
    {
      question: "Which HTML tag is used to define a JavaScript script?",
      options: ["<script>", "<js>", "<javascript>", "<code>"],
      answer: 0,
    },
    {
      question: "What does HTML stand for?",
      options: [
        "Hyper Trainer Marking Language",
        "Hyper Text Markup Language",
        "Hyper Text Marketing Language",
      ],
      answer: 1,
    },
    {
      question: "Which CSS property controls the text size?",
      options: ["font-style", "text-size", "font-size"],
      answer: 2,
    },
  ];
  const whoIsGame = [
    "Who is most likely to become a billionaire?",
    "Who is most likely to go viral on TikTok?",
    "Who is most likely to forget their password?",
    "Who is most likely to hack into NASA?",
    "who is most likey to have isekaid?",
  ];

  // Helper Functions
  async function isBotAdmin(groupId) {
    try {
      const metadata = await sock.groupMetadata(groupId);
      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      return metadata.participants.some((p) => p.id === botNumber && p.admin);
    } catch {
      return false;
    }
  }

  async function getGroupAdmins(groupId) {
    try {
      const metadata = await sock.groupMetadata(groupId);
      return metadata.participants.filter((p) => p.admin).map((p) => p.id);
    } catch {
      return [];
    }
  }

  // Messages Handler
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe || !msg.key.remoteJid) return;
    const chatId = msg.key.remoteJid;
    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const sender = msg.key.participant || msg.key.remoteJid;

    const isGroup = chatId.endsWith("@g.us");

    // MODERATION: Only apply if in group and bot is admin
    if (isGroup) {
      const botIsAdmin = await isBotAdmin(chatId);
      if (botIsAdmin) {
        const admins = await getGroupAdmins(chatId);
        const isLink = text.includes("http") || text.includes("www");

        if (isLink && !admins.includes(sender)) {
          await sock.sendMessage(chatId, {
            text: "⚠️ Warning: Please avoid sharing links in this group else u will be kicked in the ahh...baaka!",
          });
        }
      }
    }

    // COMMANDS — Apply for all users
    if (text.startsWith("!")) {
      const command = text.trim().toLowerCase();

      if (command === "!whois") {
        const random = whoIsGame[Math.floor(Math.random() * whoIsGame.length)];
        await sock.sendMessage(chatId, { text: random });
      }

      if (command === "!quote") {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        await sock.sendMessage(chatId, {
          text: `💡 Quote of the day:\n"${quote}"`,
        });
      }

      if (command === "!quiz") {
        const options = quiz.options
          .map((opt, i) => `${i + 1}. ${opt}`)
          .join("\n");
        await sock.sendMessage(chatId, {
          text: `🧠 Quiz Time!\n\n${quiz.question}\n${options}`,
        });
      }

      if (command === "!help" || command === "!commands") {
        await sock.sendMessage(chatId, {
          text: `📜 *Bot Commands:*\n
!whois - Fun group game
!quote - Quote of the Day
!quiz - Answer a quiz question
!commands - Show this list
                    `,
        });
      }
    }
  });

  // Welcome/Goodbye
  sock.ev.on("group-participants.update", async (update) => {
    const { id: groupId, action, participants } = update;
    const botIsAdmin = await isBotAdmin(groupId);
    if (!botIsAdmin) return;

    const mentions = participants.map(p => p);
    const user = participants[0].split("@")[0];

    if (action === "add") {
        const msg = `👋 Yokoso, @${user}! watashi no soul soc...Glad to have you here.`;
        await sock.sendMessage(groupId, { text: msg, mentions });
    }

    if (action === "remove") {
        const leavingUser = participants[0].split("@")[0];
        const msg = `👋 Sayonara @${leavingUser}. We'll miss you... jk we won't lol!`;
        await sock.sendMessage(groupId, { text: msg, mentions });
    }
});


  // Connection Handling
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("Bot connected successfully!");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();
