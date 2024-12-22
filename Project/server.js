const express = require('express');
const WebSocket = require('ws');

//configurarea serverului HTTP
const app = express();

// serveste fisierele statice (de ex. index.html)-ajuta la rularea in browser
app.use(express.static('public'));
// creeaza serverul HTTP
const server = app.listen(3000, () => {
    console.log(`http://localhost:3000`);
});



// creeaza WebSocket Server,permite comunicarea in timp real prin WebSocket
const wss = new WebSocket.Server({ server });

// Lista de cuvinte
const words = ["floare", "masina", "soare", "pisica", "casa"];

// Functia pentru a genera un cuvant aleator
function generateRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

// trimiterea cuvantului generat tuturor clientilor
function sendGeneratedWord() {
    const word = generateRandomWord();
    broadcast({ type: "word", word }); // trimite cuvantul ca mesaj de tip "word"
    broadcast({ type: "resetTimer", timeLimit: 30  }); // trimite un semnal de resetare a timer-ulu
}

//wss.on("connection"): seteaza un eveniment care se declanseaza cand un client WebSocket se conecteaza
//ws: obiectul WebSocket care reprez conexiunea clientului
wss.on("connection", (ws) => {
    console.log("Un nou client s-a conectat.");

    // notificare intrare utilizator
    broadcast({ type: "system", message: "Un nou utilizator a intrat în chat." }, ws);

    //se genereaza un cuvant si se trimite clientului tocmai conectat
    ws.send(JSON.stringify({ type: "word", word: generateRandomWord() }));

//ws.on("message"): eveniment declansat cand serverul primeste un mesaj de la un client
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        if (data.type === "chat") {
            // mesaje de chat
            broadcast({ type: "chat", message: `Utilizator: ${data.message}` });
        } else if (["draw", "start", "stop", "clear"].includes(data.type)) {
            // alte mesaje (desen, etc.)
            broadcast(data, ws);
        }
    });

    ws.on("close", () => {
        console.log("Un client s-a deconectat.");
        broadcast({ type: "system", message: "Un utilizator a parasit chatul." });
    });
});

// functie pentru trimiterea mesajelor tuturor clientilor
function broadcast(data, excludeWs) {
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

//se genereaza un cuvant la fiecare 30 de secunde care se trimite tuturor clientilor
setInterval(() => {
    sendGeneratedWord();
}, 30000);
