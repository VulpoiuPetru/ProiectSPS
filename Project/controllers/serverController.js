const words = ["floare", "masina", "soare", "pisica", "casa"];
let lobby = [];
let gameStarted = false;
let currentArtist = null;
let currentWord = "";
let guessedPlayers = new Set();
let currentRound = 0;
let totalRounds = 0;
let gameTimer = null;
let gameTimeLeft = 0;

function broadcast(wss, data, excludeWs = null) {
    wss.clients.forEach(client => {
        if (client !== excludeWs && client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
}

exports.initWebSocket = (wss) => {
    wss.on("connection", (ws) => {
        console.log("Un nou jucător s-a conectat.");
        lobby.push(ws);

        if (!gameStarted && lobby.length === 1) {
            startLobbyTimer(wss);
        }

        ws.on("message", (message) => {
            const data = JSON.parse(message);
            handleGameMessage(ws, wss, data);
        });

        ws.on("close", () => {
            lobby = lobby.filter(player => player !== ws);
            if (ws === currentArtist) {
                currentArtist = null;
                clearGameTimer();
                broadcast(wss, { type: "system", message: "Artistul a părăsit jocul. Jocul a fost oprit." });
                gameStarted = false;
            }

            if (lobby.length === 0) {
                clearGameTimer();
                gameStarted = false;
            }
        });
    });
};

function startLobbyTimer(wss) {
    let lobbyTimeLeft = 10;
    const timer = setInterval(() => {
        lobbyTimeLeft--;
        broadcast(wss, { type: "lobby-timer", time: lobbyTimeLeft });

        if (lobbyTimeLeft <= 0) {
            clearInterval(timer);
            if (lobby.length > 0) {
                startGame(wss);
            }
        }
    }, 1000);
}

function startGame(wss) {
    gameStarted = true;
    totalRounds = lobby.length;
    currentRound = 0;
    startNewRound(wss);
}

function startNewRound(wss) {
    if (currentRound >= totalRounds) {
        broadcast(wss, { type: "game-over", message: "Jocul s-a terminat!" });
        resetGame();
        return;
    }

    currentRound++;
    guessedPlayers.clear();
    currentArtist = lobby[currentRound % lobby.length];
    const wordChoices = generateRandomWords();

    currentArtist.send(JSON.stringify({ type: "choose-word", words: wordChoices }));
    broadcast(wss, { type: "system", message: `Artistul a fost selectat. Așteptăm alegerea cuvântului.` }, currentArtist);
}

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

function handleGameMessage(ws, wss, data) {
    switch (data.type) {
        case "choose-word":
            if (ws === currentArtist) {
                currentWord = data.word;
                broadcast(wss, { type: "hidden-word", word: "_ ".repeat(currentWord.length) }, currentArtist);

                broadcast(wss, { type: "system", message: "Jocul a început! Ghiciți cuvântul!" });
                startGameTimer(wss);
            }
            break;

        case "chat":
            if (guessedPlayers.has(ws)) {
                ws.send(JSON.stringify({ type: "system", message: "Ai ghicit deja cuvântul!" }));
                return;
            }

            if (data.message.toLowerCase() === currentWord.toLowerCase() && ws !== currentArtist) {
                guessedPlayers.add(ws);
                ws.send(JSON.stringify({ type: "system", message: `Ai ghicit corect cuvântul: ${currentWord}` }));
                broadcast(wss, { type: "system", message: "Un jucător a ghicit cuvântul!" }, ws);
            } else {
                broadcast(wss, { type: "chat", message: data.message }, ws);
            }
            break;

        // default:
        //     console.log(`Tip de mesaj necunoscut: ${data.type}`);
    }
}

function startGameTimer(wss) {
    gameTimeLeft = 20;
    gameTimer = setInterval(() => {
        gameTimeLeft--;
        broadcast(wss, { type: "start-timer", time: gameTimeLeft });

        if (gameTimeLeft <= 0) {
            clearGameTimer();
            broadcast(wss, { type: "system", message: "Timpul a expirat!" });
            startNewRound(wss);
        }
    }, 1000);
}

function clearGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

function resetGame() {
    lobby = [];
    gameStarted = false;
    currentArtist = null;
    currentWord = "";
    guessedPlayers.clear();
    currentRound = 0;
    totalRounds = 0;
}