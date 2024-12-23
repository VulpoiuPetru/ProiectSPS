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
let startTimer = null; // Timer pentru lobby
let roundTimer = null; // Timer pentru rundă
let lobbyTimeLeft = 30; // Timp rămas în lobby (în secunde)
let roundTimeLeft = 30; // Timp pentru fiecare rundă
let currentArtist = null; // Jucătorul care primește selecția cuvintelor

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
    if (lobby.length > 0) {
        currentArtist = lobby[0]; // Selectează primul jucător din lobby ca artist
        const generatedWords = generateRandomWords();
        currentArtist.send(JSON.stringify({ type: 'start-game', words: generatedWords })); // Trimite cuvintele artistului
        broadcastToOthers(currentArtist, { type: 'info', message: "Artistul selectează un cuvânt. Așteptați..." });
        console.log("Artistul a primit cuvintele:", generatedWords);
    }
}

// Pornește timerul pentru rundă
function startRoundTimer() {
    roundTimeLeft = 30; // Setează timpul pentru rundă
    roundTimer = setInterval(() => {
        roundTimeLeft -= 1;
        broadcast({ type: 'round-timer', time: roundTimeLeft }); // Trimite timpul rămas tuturor jucătorilor

        if (roundTimeLeft <= 0) {
            clearInterval(roundTimer);
            endRound();
        }
    }, 1000);
}

// Funcție pentru încheierea rundei
function endRound() {
    console.log("Runda s-a încheiat!");
    currentArtist = null; // Resetează artistul
    broadcast({ type: 'info', message: "Runda s-a încheiat! Așteptați următoarea rundă..." });
    setTimeout(startGame, 5000); // Pornește următoarea rundă după 5 secunde
}

// Funcție pentru trimiterea mesajelor tuturor clienților, cu excepția unuia
function broadcastToOthers(excludedClient, data) {
    wss.clients.forEach((client) => {
        if (client !== excludedClient && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
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

    if (!gameStarted && lobby.length === 1) {
        console.log("Primul jucător a intrat. Pornim timer-ul pentru lobby.");
        lobbyTimeLeft = 30;
        startTimer = setInterval(() => {
            lobbyTimeLeft -= 1;
            broadcast({ type: 'lobby-timer', time: lobbyTimeLeft });

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

        switch (data.type) {
            case 'word-choice':
                console.log(`Artistul a selectat cuvântul: ${data.word}`);
                broadcastToOthers(ws, { type: 'info', message: "Artistul desenează. Ghiciti ce desenează!" });
                startRoundTimer(); // Pornește timer-ul rundei după selecția cuvântului
                break;

            case 'chat':
                console.log(`Mesaj de la client: ${data.message}`);
                broadcast({ type: 'chat', message: data.message });
                break;

            case 'draw':
                broadcastToOthers(ws, { type: 'draw', coords: data.coords });
                break;

            default:
                console.log(`Tip de mesaj necunoscut: ${data.type}`);
        }
    });

    // Gestionare deconectare client
    ws.on('close', () => {
        console.log('Un jucător a părăsit lobby-ul.');
        lobby = lobby.filter((player) => player !== ws);
        if (currentArtist === ws) {
            currentArtist = null; // Resetează artistul dacă acesta s-a deconectat
        }
        if (lobby.length === 0 && startTimer) {
            console.log("Toți jucătorii au părăsit lobby-ul. Oprim timer-ul.");
            clearInterval(startTimer); // Oprește timer-ul dacă nu mai sunt jucători
            startTimer = null;
            gameStarted = false; // Resetează starea jocului
        }
    });
});
