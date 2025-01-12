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
    } else if (data.type === "chosen-word") {
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
