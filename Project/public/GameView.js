export class GameView {
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
        this.lobbymessage = document.getElementById("lobby-message"); // Adaugă această linie

    }

    updateLobbyTimer(time) {
        this.lobbyTimerLabel.textContent = `Timp rămas: ${time}s`;
        if (time <= 0) {
            this.lobbyTimerLabel.textContent = null // Ascunde overlay-ul când timpul ajunge la 0
            this.lobbymessage.textContent = null;
        }
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
        if (!word) {
            this.generatedWordElement.textContent = ""; // Șterge cuvântul afișat
        } else {
            this.generatedWordElement.textContent = `Cuvânt selectat: ${word}`;
        }
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