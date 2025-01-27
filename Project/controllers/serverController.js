module.exports.initWebSocket = (wss) => {
//const wss = new WebSocket.Server({ server });
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

    if (!gameStarted && lobby.length === 2) {
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
};