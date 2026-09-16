🎮 Tic-Tac-Toe

A modern Tic-Tac-Toe game with Single Player AI, local Pass & Play, and real-time online multiplayer — all in a simple web-based interface.

live demo web - https://tictactoe-xx1u.onrender.com

✨ Features

- 🤖 AI Mode — Play Tic-Tac-Toe against an AI opponent.
- 👥 Pass & Play — Two players can play locally on the same device.
- 🌐 Online Multiplayer — Play with another player remotely in real time.
- 🏠 Create Room — Create a private multiplayer room.
- 🔑 Random Room Code — A unique code is generated for every room.
- 🔗 Join Room — Join a multiplayer game using a room code.
- ⚡ Real-Time Gameplay — Moves are synchronized instantly between players.
- 🔌 Peer-to-Peer Communication — Uses PeerJS for player-to-player communication.
- 🚫 No Dedicated Backend — No custom application backend or database is required.
- 📱 Responsive Design — Works across desktop and mobile devices.
- 🔄 Play Again — Quickly start another round after a game ends.
- 🏆 Win / Draw Detection — Automatically detects winning and draw conditions.

🎮 Game Modes

🤖 AI Mode

Play against an AI opponent when you want a single-player experience.

The AI automatically responds to the player's moves and provides an offline-style single-player game experience.

👥 Pass & Play

Play with a friend on the same device.

Simply take turns playing as:

Player X → Player O → Player X → Player O

No internet connection between two devices is required for this mode.

🌐 Online Multiplayer

Play against another player remotely using a room-based multiplayer system.

Create Room
     ↓
Random Room Code
     ↓
Share Code
     ↓
Opponent Joins
     ↓
Peer Connection
     ↓
Real-Time Game

🔌 Multiplayer Technology

The online multiplayer mode uses PeerJS and WebSocket-based real-time communication to establish and maintain communication between players.

The game does not require a traditional custom backend for handling game moves or storing game sessions.

       Player X
          │
          │
          │  Peer Connection
          │
          ▼
      Multiplayer
       Session
          ▲
          │
          │  Peer Connection
          │
       Player O

🏠 Create a Room

1. Select Online Multiplayer.
2. Create a new room.
3. A random room code is generated.
4. Share the code with your opponent.
5. Your opponent joins using the code.
6. Start playing in real time.

🔗 Join a Room

1. Select Online Multiplayer.
2. Enter the room code.
3. Join the room.
4. Wait for the peer connection.
5. Start playing.

🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- PeerJS
- WebSocket
- Peer-to-Peer Networking

⚡ Highlights

The project combines three different gameplay experiences in one web application:

             🎮 TIC-TAC-TOE
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     🤖 AI       👥 PASS & PLAY   🌐 ONLINE
    Single        Same Device    Multiplayer
    Player                         P2P

The online mode demonstrates how real-time multiplayer gameplay can be implemented in a browser without building a traditional custom backend for the game logic.

🌐 Deployment

The application can be deployed on static hosting platforms such as:

- GitHub Pages
- Vercel
- Netlify
- Other static hosting services
- onrender

⚠️ Notes

- Online multiplayer depends on the PeerJS/signaling infrastructure and network conditions.
- Peer-to-peer connections can sometimes be affected by NAT or firewall restrictions.
- Room sessions are temporary and are not stored in a database.
- The AI and Pass & Play modes can be used without creating an online multiplayer room.

🚀 Future Improvements

- 💬 In-game chat
- 🏆 Multiplayer leaderboard
- 👤 Custom player names
- 🎨 More themes
- 🔊 Sound effects
- 📊 Match statistics
- 🥇 Online ranking system
- 🎯 Different AI difficulty levels

---

👨‍💻 About

Tic-Tac-Toe is a browser-based game built to combine classic local gameplay with AI and real-time peer-to-peer multiplayer.

Made with ❤️ and JavaScript.

⭐ If you like the project, consider giving the repository a star!