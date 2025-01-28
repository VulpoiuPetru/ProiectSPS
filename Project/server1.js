const express = require("express");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// Configurare server HTTP
const app = express();

app.use(bodyParser.urlencoded({ extended: true })); // Pentru a procesa formularele

let loggedInUsers = [];//pt a stoca utilizatorii autentificati

const { Pool } = require("pg");

// Configurare conexiune PostgreSQL
const pool = new Pool({
    user: "postgres", // Înlocuiește cu utilizatorul tău PostgreSQL
    host: "localhost", // Adresa serverului PostgreSQL
    database: "Sps", // Numele bazei de date
    password:"123",
    port: 5432, // Portul default pentru PostgreSQL
});



// Rute pentru redirectionare
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// Adauga utilizator nou în `users.json`
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    try {
        // Verifică dacă utilizatorul există deja
        const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userCheck.rows.length > 0) {
            return res.send(`<script>alert('Username is already signed!'); window.location='/';</script>`);
        }

        // Adaugă utilizatorul în baza de date
        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
        res.send(`<script>alert('Success signed!'); window.location='/';</script>`);
    } catch (err) {
        console.error("Eroare la baza de date:", err);
        res.status(500).send("Eroare server.");
    }
});


// Verifica utilizatorul la login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    try {
        // Verifică utilizatorul în baza de date
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );

        if (result.rows.length > 0) {
            loggedInUsers.push(username);
            return res.redirect("/index.html");
        } else {
            return res.send(`<script>alert('Invalid credentials!'); window.location='/';</script>`);
        }
    } catch (err) {
        console.error("Eroare la baza de date:", err);
        res.status(500).send("Eroare server.");
    }
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
let guessedPlayers = new Set(); // Set pentru a evita duplicatele

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
            broadcast({ type: "start-game" }); // Trimite un mesaj de început de joc
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
                // Verifică dacă jucătorul a ghicit deja cuvântul
                if (guessedPlayers.has(ws)) {
                    ws.send(JSON.stringify({
                        type: "system",
                        message: "Ai ghicit deja cuvântul! Așteaptă următoarea rundă.",
                    }));
                    return;
                }

                // Verifică dacă mesajul este corect
                if (data.message.toLowerCase() === currentWord.toLowerCase() && ws !== currentArtist) {
                    // Adaugă jucătorul în lista celor care au ghicit
                    guessedPlayers.add(ws);

                    // Trimite un mesaj de felicitare doar jucătorului
                    ws.send(JSON.stringify({
                        type: "system",
                        message: `Felicitări! Ai ghicit cuvântul: ${currentWord}.`,
                    }));

                    // Notifică restul jucătorilor
                    broadcast({
                        type: "system",
                        message: `Un jucător a ghicit cuvântul! Continuați să ghiciți.`,
                    }, ws);
                } else {
                    // Trimite mesajul în chat
                    broadcast({
                        type: "chat",
                        message: `${ws.username}: ${data.message}`,
                    });
                }
                break;

                case "choose-word":
    if (ws === currentArtist) {
        currentWord = data.word;

        // Trimite cuvântul complet doar artistului
        currentArtist.send(JSON.stringify({ type: "chosen-word", word: currentWord }));

        // Trimite liniuțe pentru ceilalți jucători
        const hiddenWord = currentWord.split("").map(() => "_").join(" "); // Transformă cuvântul în liniuțe
        broadcast(
            {
                type: "hidden-word", // Folosim un tip separat pentru ceilalți
                word: hiddenWord, // Liniuțe pentru ceilalți
            },
            currentArtist // Exclude artistul din broadcast
        );

        // Notifică despre începerea rundei și setează timer-ul
        broadcast({ type: "start-timer", time: 20 });
        broadcast({ type: "system", message: "Artistul a început să deseneze!" }, currentArtist);

        // Setează timpul de joc
        gameTimeLeft = 20;
        gameTimer = setInterval(() => {
            gameTimeLeft -= 1;
            broadcast({ type: "update-timer", time: gameTimeLeft });

            if (gameTimeLeft <= 0) {
                clearInterval(gameTimer);
                gameTimer = null;

                // Trimite mesaj că timpul a expirat și începe o nouă rundă
                broadcast({ type: "system", message: "Timpul a expirat! Jocul s-a terminat." });
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
        ws.username = `Player ${wss.clients.size}`;

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
        broadcast({
            type: "game-over",
            message: "Jocul s-a terminat. Veți fi redirecționați către pagina de login."
        });
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
    guessedPlayers.clear(); // Resetează lista jucătorilor care au ghicit

    // Trimite mesaj despre runda curentă
    broadcast({
        type: "round-update",
        currentRound: currentRound,
        totalRounds: totalRounds,
    });

  // Trimite un mesaj de resetare pentru cuvânt
  broadcast({
    type: "reset-word",
});

    // Resetează artiștii
    broadcast({ type: "reset-artist" });
    lobby.forEach((player) => {
        const isNewArtist = player === currentArtist;
        player.send(
            JSON.stringify({
                type: "artist-status",
                isArtist: isNewArtist,
                playerId: currentArtist.username
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

