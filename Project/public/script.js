const socket = new WebSocket("ws://localhost:3000");

// Elemente din DOM
const overlay = document.getElementById("overlay");
const wordChoicesContainer = document.getElementById("word-choices");
const generatedWordElement = document.getElementById("generated-word");
const brushSize = document.getElementById("brush-size");
const colorPicker = document.getElementById("color-picker");
const clearButton = document.getElementById("clear");
const eraserButton = document.getElementById("eraser");
const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");
const timerLabel = document.getElementById("base-timer-label");
const lobbyContainer = document.getElementById("lobby-container");
const lobbyMessage = document.getElementById("lobby-message");
const lobbyTimer = document.getElementById("lobby-timer");
const chatInput = document.getElementById("chat-input");
const chatSendButton = document.getElementById("send-chat");
const chatMessages = document.getElementById("chat-messages");

let drawingEnabled = false; // Permite desenul doar artistului
let isDrawing = false; // Starea desenului
let eraserMode = false; // Modul radieră
let timerInterval = null;

// Gestionare mesaje primite de la server
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    // Notifică jucătorul că este în lobby
    if (data.type === 'lobby-join') {
        lobbyContainer.style.display = "block"; // Afișează containerul lobby-ului
        lobbyMessage.textContent = "Ești în lobby. Așteaptă să înceapă jocul...";
    }

    // Actualizează timer-ul din lobby
    if (data.type === 'lobby-timer') {
        lobbyTimer.textContent = data.time; // Actualizează timpul rămas
        if (data.time <= 0) {
            lobbyContainer.style.display = "none"; // Ascunde lobby-ul când jocul începe
        }
    }

    // Începerea jocului pentru artist
    if (data.type === 'start-game') {
        overlay.style.display = "flex"; // Afișează overlay-ul pentru selecția cuvintelor
        wordChoicesContainer.innerHTML = ""; // Curăță lista anterioară
        data.words.forEach((word) => {
            const button = document.createElement("button");
            button.textContent = word;
            button.addEventListener("click", () => {
                socket.send(JSON.stringify({ type: "word-choice", word })); // Trimite cuvântul ales
                generatedWordElement.textContent = `Cuvânt selectat: ${word}`;
                overlay.style.display = "none"; // Ascunde overlay-ul
                drawingEnabled = true; // Permite desenul pentru artist
            });
            wordChoicesContainer.appendChild(button);
        });
    }

    // Mesaj pentru ceilalți jucători
    if (data.type === 'info') {
        alert(data.message); // Afișează mesajul pentru ceilalți jucători
    }

    // Mesaje din chat
    if (data.type === 'chat') {
        const newMessage = document.createElement("div");
        newMessage.textContent = data.message;
        chatMessages.appendChild(newMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Derulează în jos
    }

    // Coordonate pentru desen
    if (data.type === 'draw') {
        ctx.lineTo(data.coords.x, data.coords.y);
        ctx.stroke();
    }
});

// Trimiterea mesajelor de chat
chatSendButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: 'chat', message }));
        chatInput.value = ""; // Golește câmpul de intrare
    }
});

// Evenimente pentru desen
brushSize.addEventListener("input", (e) => (ctx.lineWidth = e.target.value));
colorPicker.addEventListener("input", (e) => {
    if (!eraserMode) {
        ctx.strokeStyle = e.target.value; // Actualizează culoarea doar dacă nu este activ modul radieră
    }
});

// Începe desenul
canvas.addEventListener("mousedown", (e) => {
    if (!drawingEnabled) return; // Nu permite desenul dacă jocul nu a început
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

// Continuă desenul
canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !drawingEnabled) return;

    const coords = { x: e.offsetX, y: e.offsetY };
    socket.send(JSON.stringify({ type: 'draw', coords })); // Trimite coordonatele către ceilalți

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
});

// Oprește desenul
canvas.addEventListener("mouseup", () => {
    if (!drawingEnabled) return;
    isDrawing = false;
    ctx.closePath();
});

// Oprește desenul dacă mouse-ul iese din canvas
canvas.addEventListener("mouseout", () => {
    if (!drawingEnabled) return;
    isDrawing = false;
    ctx.closePath();
});

// Funcția pentru ștergere
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Șterge tot conținutul canvas-ului
});

// Funcția pentru radieră
eraserButton.addEventListener("click", () => {
    eraserMode = !eraserMode; // Comută modul radieră
    if (eraserMode) {
        ctx.strokeStyle = "#ffffff"; // Setează culoarea radierii la alb
        eraserButton.textContent = "Desen"; // Schimbă textul butonului
    } else {
        ctx.strokeStyle = colorPicker.value; // Revine la culoarea selectată
        eraserButton.textContent = "Eraser";
    }
});

// Timer pentru runde
function resetTimer(timeLimit) {
    clearInterval(timerInterval); // Resetează orice timer existent
    let timeLeft = timeLimit;
    timerLabel.textContent = formatTime(timeLeft);
    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerLabel.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endRound();
        }
    }, 1000);
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// Funcția pentru sfârșitul rundei
function endRound() {
    drawingEnabled = false; // Dezactivează desenul
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Curăță canvas-ul
    overlay.style.display = "flex"; // Reafișează overlay-ul pentru selecția unui nou cuvânt
    socket.send(JSON.stringify({ type: "request-new-words" })); // Solicită noi cuvinte
}
