export class GameModel {
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