const express = require("express");
const WebSocket = require("ws");

// Configurare server HTTP
const app = express();
app.use(express.static("public"));
const server = app.listen(3000, () => {
    console.log(`Serverul rulează la: http://localhost:3000`);
});

// Configurare WebSocket
const wss = new WebSocket.Server({ server });

let lobby = [];
let gameStarted = false;
let currentArtist = null;
let currentWord = "";
let startTimer = null;
let lobbyTimeLeft = 10;
const words = ["floare", "masina", "soare", "pisica", "casa"];

// Funcție pentru a genera trei cuvinte aleatorii
function generateRandomWords() {
    const selectedWords = [];
    while (selectedWords.length < 3) {
        const word = words[Math.floor(Math.random() * words.length)];
        if (!selectedWords.includes(word)) {
            selectedWords.push(word);
        }
    }
    return selectedWords;
}

// Funcție pentru trimiterea mesajelor tuturor clienților
function broadcast(data, excludeWs = null) {
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Funcție pentru începerea jocului
function startGame() {
    if (lobby.length > 0) {
        gameStarted = true;
        currentArtist = lobby[0];
        const wordChoices = generateRandomWords();
        currentArtist.send(JSON.stringify({ type: "choose-word", words: wordChoices }));
        broadcast({ type: "system", message: "Artistul a fost selectat. Așteptați alegerea cuvântului." }, currentArtist);
    }
}

// Timer pentru lobby
function startLobbyTimer() {
    startTimer = setInterval(() => {
        lobbyTimeLeft -= 1;
        broadcast({ type: "lobby-timer", time: lobbyTimeLeft });

        if (lobbyTimeLeft <= 0) {
            clearInterval(startTimer);
            startGame();
        }
    }, 1000);
}

// Gestionare conexiune WebSocket
wss.on("connection", (ws) => {
    console.log("Un nou jucător s-a conectat.");
    lobby.push(ws);

    if (!gameStarted && lobby.length === 1) {
        lobbyTimeLeft = 10;
        startLobbyTimer();
    }

    ws.send(JSON.stringify({ type: "system", message: "Te-ai conectat la joc." }));

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case "chat":
                broadcast({ type: "chat", message: `Utilizator: ${data.message}` });
                break;

            case "choose-word":
                if (ws === currentArtist) {
                    currentWord = data.word;
                    currentArtist.send(JSON.stringify({ type: "chosen-word", word: currentWord }));
                    broadcast({ type: "system", message: "Artistul a început să deseneze!" }, currentArtist);
                }
                break;

            case "start":
            case "draw":
            case "stop":
            case "clear":
                if (gameStarted && ws === currentArtist) {
                    broadcast(data, ws);
                }
                break;

            default:
                console.log(`Tip de mesaj necunoscut: ${data.type}`);
        }
    });

    ws.on("close", () => {
        lobby = lobby.filter((player) => player !== ws);
        if (ws === currentArtist) {
            currentArtist = null;
        }
        if (lobby.length === 0 && startTimer) {
            clearInterval(startTimer);
            startTimer = null;
            gameStarted = false;
        }
    });
});
