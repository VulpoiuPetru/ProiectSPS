const express = require("express");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// Configurare server HTTP
const app = express();

app.use(bodyParser.urlencoded({ extended: true })); // Pentru a procesa formularele

let loggedInUsers = [];//pt a stoca utilizatorii autentificati

// Rute pentru redirectionare
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// Adauga utilizator nou în `users.json`
app.post("/signup", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    const usersFilePath = path.join(__dirname, "users.json");

    // Citeste utilizatorii existenti din fisier
    fs.readFile(usersFilePath, "utf8", (err, data) => {
        let users = [];
        if (err) {
            if (err.code === "ENOENT") {
                // Daca fisierul nu exista, initializează un array gol
                console.log("Fișierul users.json nu exista. Va fi creat unul nou.");
            } else {
                console.error("Eroare la citirea fisierului users.json:", err);
                return res.status(500).send("Eroare server.");
            }
        } else {
            // Daca fisierul exista, incearca sa parcurgi datele
            try {
                users = JSON.parse(data) || [];
            } catch (parseError) {
                console.error("Eroare la parsarea fisierului users.json:", parseError);
                return res.status(500).send("Eroare server.");
            }
        }

        const existingUser = users.find((user) => user.username === username);

        if (existingUser) {
            return res.send(`<script>alert('Username is already signed!'); window.location='/';</script>`);
        }

        // Adauga noul utilizator
        users.push({ username, password });
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error("Eroare la salvarea fisierului users.json:", err);
                return res.status(500).send("Eroare server.");
            }

            res.send(`<script>alert('Success signed!'); window.location='/';</script>`);
        });
    });
});

// Verifica utilizatorul la login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    const usersFilePath = path.join(__dirname, "users.json");

    fs.readFile(usersFilePath, "utf8", (err, data) => {
        if (err) {
            if (err.code === "ENOENT") {
                console.error("Fisierul users.json nu exista.");
                return res.send(`<script>alert('Nu exista utilizatori inregistrati!'); window.location='/';</script>`);
            } else {
                console.error("Eroare la citirea fisierului users.json:", err);
                return res.status(500).send("Eroare server.");
            }
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error("Eroare la parsarea fisierului users.json:", parseError);
            return res.status(500).send("Eroare server.");
        }

        const user = users.find((user) => user.username === username && user.password === password);

        if (user) {
            loggedInUsers.push(username);
            return res.redirect("/index.html");
        } else {
            return res.send(`<script>alert('You didn't write good!'); window.location='/';</script>`);
        }
    });
});




// Redirectioneaza la index dupa login
// app.get("/index.html", (req, res) => {
//     if (loggedInUsers.length > 0) {
//         res.sendFile(__dirname + "/public/index.html");
//     } else {
//         res.redirect("/");
//     }
// });
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.static("public"));

// Server
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

let currentRound = 0; // Runda curentă
    let totalRounds = 0; // Totalul rundelor (setat la numărul de jucători)
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
// function startGame() {
//     if (lobby.length > 0) {
//         gameStarted = true;
//         currentArtist = lobby[0];
//         const wordChoices = generateRandomWords();
//         currentArtist.send(JSON.stringify({ type: "choose-word", words: wordChoices }));
//         broadcast({ type: "system", message: "Artistul a fost selectat. Așteptați alegerea cuvântului." }, currentArtist);
        
//     }
// }

function startGame() {
    if (lobby.length > 0) {
        gameStarted = true;
        totalRounds = lobby.length; // Setează numărul de runde egal cu numărul de jucători
        currentRound = 0; // Începe de la runda 0
        startNewRound();
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
                    broadcast({ type: "start-timer", time: 10 }); // Exemplu: 60 de secunde
                    broadcast({ type: "system", message: "Artistul a început să deseneze!" }, currentArtist);
                    gameTimeLeft = 10; // Setează timpul de joc
                    gameTimer = setInterval(() => {
                        gameTimeLeft -= 1;
                        broadcast({ type: "update-timer", time: gameTimeLeft });

                        if (gameTimeLeft <= 0) {
                            clearInterval(gameTimer);
                            gameTimer = null;
                            broadcast({ type: "system", message: "Timpul a expirat! Jocul s-a terminat." });
                            // gameStarted = false;
                            startNewRound(); // Începe o nouă rundă

                        }
                    }, 1000);
                }
                break;

            case "start":
            case "draw":
            case "stop":
            case "clear":
               if (gameStarted && ws === currentArtist) {
                broadcast(data, ws);
            } else {
                ws.send(JSON.stringify({ type: "error", message: "Doar artistul curent poate desena!" }));
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

function startNewRound() {
    if (currentRound >= totalRounds) {
        // Trimite mesajul de terminare a jocului
        broadcast({ type: "game-over", message: "Jocul s-a terminat. Veți fi redirecționați către login." });

        // Resetează starea jocului
        gameStarted = false;
        currentArtist = null;
        currentRound = 0;
        return;
    }

    // Selectează următorul artist
    const currentArtistIndex = lobby.indexOf(currentArtist);
    const nextArtistIndex = (currentArtistIndex + 1) % lobby.length;
    currentArtist = lobby[nextArtistIndex];

    // Crește numărul rundei curente
    currentRound++;

    // Trimite mesaj despre runda curentă
    broadcast({
        type: "round-update",
        currentRound: currentRound,
        totalRounds: totalRounds,
    });

    // Resetează artiștii
    broadcast({ type: "reset-artist" });
    lobby.forEach((player) => {
        const isNewArtist = player === currentArtist;
        player.send(
            JSON.stringify({
                type: "artist-status",
                isArtist: isNewArtist,
            })
        );
    });

    // Trimite cuvintele noului artist
    const wordChoices = generateRandomWords();
    currentArtist.send(JSON.stringify({ type: "choose-word", words: wordChoices }));
}


function endGame() {
    broadcast({ type: "system", message: "Jocul s-a terminat! Sperăm că v-a plăcut!" });
    gameStarted = false;
    currentArtist = null;
    currentRound = 0;
    totalRounds = 0;
}

