class GameModel {
    constructor() {
        this.players = [];
        this.currentWord = "";
        this.isArtist = false;
        this.lobbyTime = 30;
        this.gameStarted = false;
        this.drawingData = [];
        this.chatMessages = [];
        this.color = "#000000";
        this.lineWidth = 5;
        this.eraserActive = false;
        this.totalRounds = 0;
        this.currentRound = 0;
        this.drawing = false;
        this.currentPlayer = null; // Noul jucător curent
    }

    setWord(word) {
        this.currentWord = word;
    }

    addChatMessage(message) {
        this.chatMessages.push(message);
    }

    startGame() {
        this.gameStarted = true;
    }

    resetGame() {
        this.gameStarted = false;
        this.currentWord = "";
        this.drawingData = [];
        this.currentRound = 0;
        this.currentPlayer = null;
    }

    toggleEraser() {
        this.eraserActive = !this.eraserActive;
    }

    setColor(color) {
        this.color = color;
    }

    setLineWidth(width) {
        this.lineWidth = width;
    }

    setRounds(totalRounds) {
        this.totalRounds = totalRounds;
    }

    incrementRound() {
        this.currentRound += 1;
    }

    setArtist(playerId) {
        this.currentPlayer = playerId;
        this.isArtist = (this.currentPlayer === playerId);  // doar jucătorul curent poate fi artist
    }
}

class GameView {
    constructor() {
        this.canvas = document.getElementById("drawing-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.clearButton = document.getElementById("clear");
        this.eraserButton = document.getElementById("eraser");
        this.colorPicker = document.getElementById("color-picker");
        this.brushSize = document.getElementById("brush-size");
        this.generatedWordElement = document.getElementById("generated-word");
        this.wordChoicesContainer = document.getElementById("word-choices");
        this.chatInput = document.getElementById("chat-input");
        this.chatMessages = document.getElementById("chat-messages");
        this.sendChatButton = document.getElementById("send-chat");
        this.lobbyTimerLabel = document.getElementById("lobby-timer");
        this.overlay = document.getElementById("overlay");
        this.roundLabel = document.getElementById("round-label");
        this.timerLabel = document.getElementById("base-timer-label");
    }

    updateLobbyTimer(time) {
        this.lobbyTimerLabel.textContent = `Timp rămas: ${time}s`;
    }

    showWordChoices(words, callback) {
        this.overlay.style.display = "flex";
        this.wordChoicesContainer.innerHTML = "";

        words.forEach((word) => {
            const button = document.createElement("button");
            button.textContent = word;
            button.addEventListener("click", () => {
                callback(word);
                this.overlay.style.display = "none";
            });
            this.wordChoicesContainer.appendChild(button);
        });
    }

    addChatMessage(message) {
        const chatMessage = document.createElement("div");
        chatMessage.textContent = message;
        this.chatMessages.appendChild(chatMessage);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    resetCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    displayCurrentWord(word) {
        this.generatedWordElement.textContent = `Cuvânt selectat: ${word}`;
    }

    updateBrushSize(size) {
        this.brushSize.value = size;
    }

    updateColor(color) {
        this.colorPicker.value = color;
    }

    toggleEraser(active) {
        this.eraserButton.textContent = active ? "Desen" : "Eraser";
    }

    updateRound(currentRound, totalRounds) {
        this.roundLabel.textContent = `Runda: ${currentRound}/${totalRounds}`;
    }

    updateGameTimer(minutes, seconds) {
        this.timerLabel.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    disableCanvas() {
        this.canvas.style.pointerEvents = "none";  // Dezactivăm canvas-ul pentru cei care nu sunt artisti
    }

    enableCanvas() {
        this.canvas.style.pointerEvents = "auto";  // Activăm canvas-ul pentru artisti
    }
}

// Controller
class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.socket = new WebSocket("ws://localhost:3000");
        this.roundTimer = null;
        this.initEventListeners();
    }

    initEventListeners() {
        // WebSocket events
        this.socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "lobby-timer") {
                this.model.lobbyTime = data.time;
                this.view.updateLobbyTimer(data.time);
                if (data.time <= 0) {
                    this.model.startGame();
                    this.view.overlay.style.display = "none";
                    this.socket.send(JSON.stringify({ type: "start-game" }));
                }
            } else if (data.type === "choose-word") {
                // Permitem artistului să aleagă cuvântul
                this.model.isArtist = true;
                this.view.enableCanvas();
                this.view.showWordChoices(data.words, (word) => {
                    this.socket.send(JSON.stringify({ type: "choose-word", word }));
                    this.model.setWord(word);
                    this.view.displayCurrentWord(word);
                });
            } else if (data.type === "round-update") {
                // Începem noua rundă și resetăm canvas-ul
                this.view.updateRound(data.currentRound, data.totalRounds);
                this.model.incrementRound();
                this.view.resetCanvas();
                this.socket.send(JSON.stringify({ type: "new-round" }));
            } else if (data.type === "start-timer") {
                this.startRoundTimer(data.time);
            } else if (data.type === "chat") {
                this.model.addChatMessage(data.message);
                this.view.addChatMessage(data.message);
            }else if (data.type === "system") {
                // Adăugăm mesajele de sistem în UI
                const chatMessage = document.createElement("div");
                chatMessage.textContent = data.message;
        
                // Evidențiem mesajele importante
                if (data.message.includes("Ai ghicit deja cuvântul")) {
                    chatMessage.style.color = "red";
                    chatMessage.style.fontWeight = "bold";
                }
        
                this.view.chatMessages.appendChild(chatMessage);
                this.view.chatMessages.scrollTop = this.view.chatMessages.scrollHeight;
            }
             else if (data.type === "start") {
                this.view.ctx.beginPath();
                this.view.ctx.moveTo(data.x, data.y);
                this.view.ctx.strokeStyle = data.color;
                this.view.ctx.lineWidth = data.lineWidth;
            } else if (data.type === "draw") {
                this.view.ctx.lineWidth = data.lineWidth;
                this.view.ctx.strokeStyle = data.color;
                this.view.ctx.lineTo(data.toX, data.toY);
                this.view.ctx.stroke();
            } else if (data.type === "clear") {
                this.view.resetCanvas();
            } else if (data.type === "set-artist") {
                // Setăm artistul pentru runda curentă
                this.model.setArtist(data.playerId);
                if (this.model.isArtist) {
                    this.view.enableCanvas(); // Permitem artistului să deseneze
                } else {
                    this.view.disableCanvas(); // Dezactivăm canvas-ul pentru ceilalți
                }
            }
        });

        // Drawing events
        this.view.canvas.addEventListener("mousedown", (e) => {
            if (!this.model.gameStarted || !this.model.isArtist) return;
            this.model.drawing = true;
            const coords = { x: e.offsetX, y: e.offsetY };
            this.view.ctx.beginPath();
            this.view.ctx.moveTo(coords.x, coords.y);
            this.socket.send(
                JSON.stringify({
                    type: "start",
                    x: coords.x,
                    y: coords.y,
                    color: this.model.eraserActive ? "#ffffff" : this.model.color,
                    lineWidth: this.model.lineWidth,
                })
            );
        });

        this.view.canvas.addEventListener("mousemove", (e) => {
            if (!this.model.drawing || !this.model.isArtist) return;
            const coords = { x: e.offsetX, y: e.offsetY };
            this.view.ctx.lineWidth = this.model.lineWidth;
            this.view.ctx.strokeStyle = this.model.eraserActive ? "#ffffff" : this.model.color;
            this.view.ctx.lineTo(coords.x, coords.y);
            this.view.ctx.stroke();
            this.socket.send(
                JSON.stringify({
                    type: "draw",
                    toX: coords.x,
                    toY: coords.y,
                    color: this.model.eraserActive ? "#ffffff" : this.model.color,
                    lineWidth: this.model.lineWidth,
                })
            );
        });

        this.view.canvas.addEventListener("mouseup", () => {
            if (!this.model.isArtist) return;
            this.model.drawing = false;
            this.view.ctx.closePath();
        });

        // UI Events
        this.view.clearButton.addEventListener("click", () => {
            if (!this.model.isArtist) return;
            this.view.resetCanvas();
            this.socket.send(JSON.stringify({ type: "clear" }));
        });

        this.view.eraserButton.addEventListener("click", () => {
            this.model.toggleEraser();
            this.view.toggleEraser(this.model.eraserActive);
        });

        this.view.colorPicker.addEventListener("input", (e) => {
            this.model.setColor(e.target.value);
        });

        this.view.brushSize.addEventListener("input", (e) => {
            this.model.setLineWidth(e.target.value);
        });

        this.view.sendChatButton.addEventListener("click", () => {
            const message = this.view.chatInput.value.trim();
    if (message) {
        this.socket.send(JSON.stringify({ type: "chat", message }));
        this.view.chatInput.value = ""; // Resetăm input-ul
    }
        });
    }

    startRoundTimer(duration) {
        clearInterval(this.roundTimer);
        let timeLeft = duration;

        this.roundTimer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(this.roundTimer);
                this.socket.send(JSON.stringify({ type: "round-over" }));
                this.view.updateGameTimer(0, 0);
            } else {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                this.view.updateGameTimer(minutes, seconds);
                timeLeft--;
            }
        }, 1000);
    }
}

// Initialize the application
const app = new GameController(new GameModel(), new GameView());
