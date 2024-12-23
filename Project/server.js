const express = require('express');
const WebSocket = require('ws');

// Configurarea serverului HTTP
const app = express();
app.use(express.static('public'));
const server = app.listen(3000, () => {
    console.log(`http://localhost:3000`);
});

// Configurarea serverului WebSocket
const wss = new WebSocket.Server({ server });

// Lista de cuvinte
const words = ["floare", "masina", "soare", "pisica", "casa", "frunza", "copac", "nor", "luna", "stea"];

// Generare trei cuvinte aleatorii
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

// Trimiterea celor trei cuvinte generate tuturor clienților
function sendGeneratedWords() {
    const generatedWords = generateRandomWords();
    broadcast({ type: "words", words: generatedWords });
    broadcast({ type: "resetTimer", timeLimit: 30 });
}

// Eveniment de conexiune pentru clienți
wss.on("connection", (ws) => {
    console.log("Un nou client s-a conectat.");
    ws.send(JSON.stringify({ type: "words", words: generateRandomWords() }));

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        if (data.type === "word-choice") {
            console.log(`Cuvânt selectat: ${data.word}`);
        }
    });

    ws.on("close", () => {
        console.log("Un client s-a deconectat.");
    });
});

// Funcție pentru a trimite mesaje tuturor clienților
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Generare cuvinte la fiecare 30 de secunde
setInterval(() => {
    sendGeneratedWords();
}, 30000);
