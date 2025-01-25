A simple WhatsApp bot built using the Baileys library. This bot automates group management tasks, including:

Sending welcome messages to new members.
Issuing warnings for unauthorized link posts (excluding admins and group owners).
Restricting functionality to groups where the bot is an admin.
The bot is written in JavaScript and leverages Node.js for backend processing.

well the setups are pretty much simple, i'll try to explain it as simple as possible.

So the are a few prerequisites to the creation of this bot
first you will need to install node.js (probaly version 14 or later) on ur system, i dont want to explain what node.js is but u can check this site for info on nodejs 'https://en.wikipedia.org/wiki/Node.js'.
secondly you will obviosly need a whatsapp account to link to the bot  and lastly you will need to ahve atleast the very basic knowledge of javascript and command-line usage

the setup steps{
if you are planning to also program this bot futher or just use it yourself since its kinda free, here are the things neede to do:
1. clone the repository using this commands in your code editors terminal preferably
  git clone <repository-url>
  cd <repository-folder>
2. Install sum dependecies with this command
  npm install

   the dependencies being installed with command are
   !Baileys: for whatsapp web api interaction
   !QRcode-terminal: to display QR codes for linking the bot
   !File system: to manage authentication
   These dependencies are included in the package.json file and will be installed during the npm install step
   4. Authentication setup: here on the first run the bot will display a QR code in the terminal. you will then scan the code with your whatsapp account using  the linked devices section in ur settings
   5. run the bot with this command:
    node bot.js
   6. Usage:
Add the bot to a group where it is an admin.
The bot will automatically manage group activity as per its configured logic.
}
Arigato pls use the bot wisely
