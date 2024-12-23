const socket = new WebSocket("ws://localhost:3000");

const overlay = document.getElementById("overlay");
const wordChoicesContainer = document.getElementById("word-choices");
const generatedWordElement = document.getElementById("generated-word");
const brushSize = document.getElementById("brush-size");
const colorPicker = document.getElementById("color-picker");
const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");
const timerLabel = document.getElementById("base-timer-label");

let drawingEnabled = false;
let drawing = false;
let timerInterval = null;
let timeLeft = 30;

// Actualizare dimensiune și culoare pensulă
brushSize.addEventListener("input", (e) => (ctx.lineWidth = e.target.value));
colorPicker.addEventListener("input", (e) => (ctx.strokeStyle = e.target.value));

// Evenimente pentru desen
canvas.addEventListener("mousedown", (e) => {
    if (!drawingEnabled) return;
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener("mousemove", (e) => {
    if (!drawing || !drawingEnabled) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});
canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.closePath();
});

// Timer
function resetTimer(timeLimit) {
    clearInterval(timerInterval);
    timeLeft = timeLimit;
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

function endRound() {
    drawingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlay.style.display = "flex";
    socket.send(JSON.stringify({ type: "request-new-words" }));
}

// WebSocket
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "words") {
        wordChoicesContainer.innerHTML = "";
        data.words.forEach((word) => {
            const button = document.createElement("button");
            button.textContent = word;
            button.addEventListener("click", () => {
                socket.send(JSON.stringify({ type: "word-choice", word }));
                generatedWordElement.textContent = `Cuvânt selectat: ${word}`;
                overlay.style.display = "none";
                drawingEnabled = true;
                resetTimer(30);
            });
            wordChoicesContainer.appendChild(button);
        });
    }
});
