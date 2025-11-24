# Battleship WebSocket Server

This is the backend server for a real-time multiplayer Battleship game, built with Node.js, TypeScript, and WebSockets. It handles all game logic, user management, and serves the static frontend client.

---

## Features

* **Real-time Multiplayer:** Uses the `ws` library for low-latency WebSocket communication.
* **User System:** In-memory user registration and login with password hashing (using the built-in `crypto` module).
* **Game Lobby:** Players can create rooms and join available rooms.
* **Full Game Logic:** Manages the entire game lifecycle:
    * Ship placement validation
    * Turn-based attacks (`attack`)
    * Random attacks (`randomAttack`)
    * Accurate "shot", "miss", and "killed" detection (including filling surrounding cells on kill)
    * Game finish (`finish`) and winner declaration.
* **Single Player Mode:** Includes a "Play with Bot" option (`single_play`).
* **Advanced AI:** The bot uses random ship placement and an "Advanced" attack AI: it actively hunts for "shot" cells to finish off ships.
* **Leaderboard:** In-memory persistent leaderboard that updates on game completion.
* **Static Server:** Serves the frontend client from the `front/` directory.

---

## Technology Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Real-time:** WebSockets (`ws`)
* **Development:** `nodemon`, `ts-node`
* **Bundling:** Webpack
* **Utilities:** `cross-env` (for cross-platform compatibility)

---

## Installation

1.  Clone the repository.

2.  Install all required dependencies:

```sh
npm install
```

---

## Running the Server

### Development Mode

This command starts the server with `nodemon` and `ts-node` for live reloading on file changes. The server will run on `http://localhost:3000`.

```sh
npm run start:dev
```

### Production Mode

This command first builds the project using Webpack into the dist/ directory, and then runs the compiled JavaScript bundle.

```sh
npm run start
```
