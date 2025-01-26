import { GameModel } from "./GameModel.js";
import { GameView } from "./GameView.js";


// Controller
class GameController {
    constructor(model = new GameModel(), view = new GameView()) {
        this.model = model;
        this.view = view;
        this.socket = new WebSocket("ws://localhost:3000");
        this.roundTimer = null;
        this.initEventListeners();
    }
    someMethodThatNeedsToBeCalled() {
        console.log("Aceasta este o metodă suplimentară.");
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
                
            } else if (data.type === "start-game") {
                this.model.startGame(); // Actualizează starea jocului în model
                this.view.overlay.style.display = "none"; // Ascunde overlay-ul de lobby
                console.log("Jocul a început!");
             }else if (data.type === "game-over") {
                alert(data.message); // Afișează un mesaj de notificare
                window.location.href = "/"; // Redirecționează către pagina de login
            }else if (data.type === "choose-word") {
                
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
            }else if (data.type === "reset-word") {
                this.model.setWord(""); // Resetează cuvântul în model
                this.view.displayCurrentWord(""); // Șterge cuvântul afișat
            }else if (data.type === "chat") {
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
                    this.model.drawing = false;
                }
            }
            if (data.type === "chosen-word") {
                // Artistul primește cuvântul complet
                this.view.displayCurrentWord(data.word);
            } else if (data.type === "hidden-word") {
                // Ceilalți jucători primesc liniuțele
                this.view.displayCurrentWord(data.word);
            }
            else if (data.type === "artist-status") {
                this.model.setArtist(data.isArtist ? this.model.currentPlayer : null);
                if (data.isArtist) {
                    this.view.enableCanvas(); // Activează canvas-ul doar pentru artist
                } else {
                    this.view.disableCanvas(); // Dezactivează canvas-ul pentru ceilalți
                    this.model.drawing = false; // Oprește starea de desenare
                }
            }
            
        });

        // Drawing events
        this.view.canvas.addEventListener("mousedown", (e) => {
            if (!this.model.gameStarted || !this.model.isArtist) {
                return;
            }    
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
            if (!this.model.isArtist) {
                return;
            }
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

const app = new GameController(new GameModel(), new GameView());