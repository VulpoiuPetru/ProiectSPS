const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");
const clearButton = document.getElementById("clear");
const eraserButton = document.getElementById("eraser");
const colorPicker = document.getElementById("color-picker");
const brushSize = document.getElementById("brush-size");
const generatedWordElement = document.getElementById("generated-word");
const wordChoicesContainer = document.getElementById("word-choices");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const sendChatButton = document.getElementById("send-chat");
const lobbyContainer = document.getElementById("lobby-container");
const lobbyTimerLabel = document.getElementById("lobby-timer");
const overlay = document.getElementById("overlay");

let drawing = false;
let lastCoords = null;
let color = "#000000";
let lineWidth = 5;
let eraserActive = false;
let inLobby = true;
let gameStarted = false;
let isArtist = false;

// Conectare WebSocket
const socket = new WebSocket("ws://localhost:3000");

// Funcționalitate desenare (desenul permis doar după lobby)
canvas.addEventListener("mousedown", (e) => {
    if (!gameStarted || inLobby || !isArtist) return;
    drawing = true;
    lastCoords = { x: e.offsetX, y: e.offsetY };
    ctx.beginPath();
    ctx.moveTo(lastCoords.x, lastCoords.y);

    socket.send(
        JSON.stringify({
            type: "start",
            x: lastCoords.x,
            y: lastCoords.y,
            color: eraserActive ? "#ffffff" : color,
            lineWidth,
        })
    );
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing || !lastCoords || !gameStarted || inLobby|| !isArtist) return;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = eraserActive ? "#ffffff" : color;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    socket.send(
        JSON.stringify({
            type: "draw",
            fromX: lastCoords.x,
            fromY: lastCoords.y,
            toX: e.offsetX,
            toY: e.offsetY,
        })
    );

    lastCoords = { x: e.offsetX, y: e.offsetY };
});

canvas.addEventListener("mouseup", () => {
    if (!drawing|| !isArtist) return;
    drawing = false;
    ctx.closePath();
    lastCoords = null;
    socket.send(JSON.stringify({ type: "stop" }));
});

canvas.addEventListener("mouseout", () => {
    if (!drawing|| !isArtist) return;
    drawing = false;
    ctx.closePath();
    lastCoords = null;
    socket.send(JSON.stringify({ type: "stop" }));
});

clearButton.addEventListener("click", () => {
    if (!isArtist) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.send(JSON.stringify({ type: "clear" }));
});

eraserButton.addEventListener("click", () => {
    if (!isArtist) return;
    eraserActive = !eraserActive;
    eraserButton.textContent = eraserActive ? "Desen" : "Eraser";
});

colorPicker.addEventListener("input", (e) => (color = e.target.value));
brushSize.addEventListener("input", (e) => (lineWidth = e.target.value));

// Funcționalitate chat
sendChatButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: "chat", message }));
        chatInput.value = "";
    }
});

// Gestionare mesaje primite de la server
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "reset-artist") {
        isArtist = false; // Resetează statusul de artist
        console.log("Nu mai sunt artist.");
    }
    else
    if (data.type === "artist-status") {
        isArtist = data.isArtist; // Actualizează statusul de artist
        console.log(isArtist ? "Sunt artist!" : "Nu sunt artist.");
    }
    else
    if (data.type === "start-timer") {
        startGameTimer(data.time); // Pornește timerul
    } else if (data.type === "update-timer") {
        const timerLabel = document.getElementById("base-timer-label");
        const minutes = Math.floor(data.time / 60);
        const seconds = data.time % 60;
        timerLabel.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    
    if (data.type === "lobby-timer") {
        lobbyTimerLabel.textContent = `Timp rămas: ${data.time}s`;
        if (data.time <= 0) {
            inLobby = false;
            lobbyContainer.style.display = "none";
            gameStarted = true;
        }
    } else if (data.type === "choose-word") {
        overlay.style.display = "flex";
        wordChoicesContainer.innerHTML = "";
        isArtist = true;

        data.words.forEach((word) => {
            const button = document.createElement("button");
            button.textContent = word;
            button.addEventListener("click", () => {
                socket.send(JSON.stringify({ type: "choose-word", word }));
                overlay.style.display = "none";
                generatedWordElement.textContent = `Cuvânt selectat: ${word}`;
            });
            wordChoicesContainer.appendChild(button);
        });
         }
        //  else if (data.type === "reset-game") {
        //     resetGameUI(); // Resetează interfața pentru toți ceilalți
        // }
          else if (data.type === "update-timer") {
        const timerLabel = document.getElementById("base-timer-label");
        const minutes = Math.floor(data.time / 60);
        const seconds = data.time % 60;
        timerLabel.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else if (data.type === "system") {
        console.log(data.message);
    }
     else if (data.type === "chosen-word") {
        isArtist = data.artist === socket.id; // Compară cu ID-ul WebSocket
        generatedWordElement.textContent = `Cuvânt selectat: ${data.word}`;
    } else if (data.type === "chat") {
        const chatMessage = document.createElement("div");
        chatMessage.textContent = data.message;
        chatMessages.appendChild(chatMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else if (data.type === "start") {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
    } else if (data.type === "draw") {
        ctx.lineWidth = data.lineWidth;
        ctx.strokeStyle = data.color;
        ctx.moveTo(data.fromX, data.fromY);
        ctx.lineTo(data.toX, data.toY);
        ctx.stroke();
    } else if (data.type === "stop") {
        ctx.closePath();
    } else if (data.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});


function startGameTimer(duration) {
    let timeLeft = duration;
    const timerLabel = document.getElementById("base-timer-label");

    const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerLabel.textContent = "00:00";
            resetGameUI();
            // alert("Timpul a expirat! Jocul s-a terminat.");
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerLabel.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            timeLeft--;
        }
    }, 1000);
}
function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "system" && data.message.includes("O nouă rundă începe")) {
        resetCanvas();
    }
});

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "system" && data.message.includes("Ghiciți:")) {
        const generatedWordElement = document.getElementById("generated-word");
        const wordPlaceholder = data.message.split("Ghiciți: ")[1];
        generatedWordElement.textContent = `Cuvânt de ghicit: ${wordPlaceholder}`;
    }
});
function resetGameUI() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Curăță canvas-ul

    if (!isArtist) {
        // Ascunde overlay-ul doar pentru jucătorii care nu sunt artiști
        overlay.style.display = "none";
    }

    generatedWordElement.textContent = "Cuvânt de ghicit: _______";
}



socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "reset-game") {
        resetGameUI(); // Resetează interfața doar pentru ceilalți jucători
    }
});


socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "round-update") {
        const roundLabel = document.getElementById("round-label");
        roundLabel.textContent = `Runda: ${data.currentRound}/${data.totalRounds}`;
    }
});


socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "game-over") {
        alert(data.message); // Notifică jucătorii
        redirectToLogin();  // Redirecționează la login
    }
});
function redirectToLogin() {
    // Ascunde elementele jocului
    document.querySelector(".game-container").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    document.getElementById("lobby-container").style.display = "none";

    // Redirecționează către pagina de login
    window.location.href = "/";
}


socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "system") {
        const chatMessage = document.createElement("div");
        chatMessage.textContent = data.message;

        // Evidențiază mesajele de eroare
        if (data.message.includes("Ai ghicit deja cuvântul")) {
            chatMessage.style.color = "red";
            chatMessage.style.fontWeight = "bold";
        }

        chatMessages.appendChild(chatMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
