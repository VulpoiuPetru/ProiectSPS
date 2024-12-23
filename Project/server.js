const express = require('express');
const WebSocket = require('ws');

// Configurare server HTTP
const app = express();
app.use(express.static('public')); // Servire fișiere statice (HTML, CSS, JS)
const server = app.listen(3000, () => {
    console.log(`Serverul rulează la: http://localhost:3000`);
});

// Configurare WebSocket
const wss = new WebSocket.Server({ server });

let lobby = []; // Lista jucătorilor în lobby
let gameStarted = false; // Indică dacă jocul a început
let startTimer = null; // Timer pentru începerea jocului
let lobbyTimeLeft = 10; // Timp rămas în lobby (în secunde)

// Lista de cuvinte pentru joc
const words = ["floare", "masina", "soare", "pisica", "casa", "stea", "copac", "lac", "munte", "nor"];

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

// Funcție pentru începerea jocului
function startGame() {
    gameStarted = true; // Setează jocul ca fiind început
    const generatedWords = generateRandomWords(); // Generează cuvinte
    broadcast({ type: 'start-game', words: generatedWords }); // Trimite cuvintele jucătorilor
    console.log("Jocul a început cu cuvintele:", generatedWords);
    lobby = []; // Golește lobby-ul pentru următorul joc
}

// Funcție pentru trimiterea mesajelor tuturor clienților
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Gestionare conexiune WebSocket
wss.on('connection', (ws) => {
    console.log('Un nou jucător s-a conectat.');
    lobby.push(ws); // Adaugă jucătorul în lobby

    // Dacă este primul jucător, pornește timer-ul pentru începerea jocului
    if (!gameStarted && lobby.length === 1) {
        console.log("Primul jucător a intrat. Pornim timer-ul pentru lobby.");
        lobbyTimeLeft = 10;
        startTimer = setInterval(() => {
            lobbyTimeLeft -= 1;
            broadcast({ type: 'lobby-timer', time: lobbyTimeLeft }); // Trimite timpul rămas clienților

            if (lobbyTimeLeft <= 0) {
                clearInterval(startTimer);
                startGame(); // Pornește jocul când timpul ajunge la 0
            }
        }, 1000);
    }

    // Notifică jucătorul că este în lobby
    ws.send(JSON.stringify({ type: 'lobby-join', message: 'Ești în lobby. Așteaptă să înceapă jocul.' }));

    // Gestionare mesaje primite de la client
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'word-choice') {
            console.log(`Jucătorul a selectat cuvântul: ${data.word}`);
        }
    });

    // Gestionare deconectare client
    ws.on('close', () => {
        console.log('Un jucător a părăsit lobby-ul.');
        lobby = lobby.filter((player) => player !== ws);
        if (lobby.length === 0 && startTimer) {
            console.log("Toți jucătorii au părăsit lobby-ul. Oprim timer-ul.");
            clearInterval(startTimer); // Oprește timer-ul dacă nu mai sunt jucători
            startTimer = null;
            gameStarted = false; // Resetează starea jocului
        }
    });
});
