const canvas = document.getElementById("drawing-canvas");//selecteaza elem <canvas> din html
const ctx = canvas.getContext("2d");//creeaza un context  2D pentru a desena pe canvas
//selecteaza elem de interfata din html
const clearButton = document.getElementById("clear");
const eraserButton = document.getElementById("eraser");
const colorPicker = document.getElementById("color-picker");
const brushSize = document.getElementById("brush-size");
const generatedWordElement = document.getElementById("generated-word");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const sendChatButton = document.getElementById("send-chat");
// setare propietati
let drawing = false;
let color = "#000000";
let lineWidth = 5;
let eraserActive = false;


// Lista de cuvinte
const words = ["floare", "masina", "soare", "pisica", "casa"];
let generatedWord = ""

// Funcția pentru generarea unui cuvânt
function generateWord() {
    generatedWord = words[Math.floor(Math.random() * words.length)];
    const hiddenWord = "_".repeat(generatedWord.length);
    generatedWordElement.textContent = `Cuvânt: ${hiddenWord}`;
}


// functiile pt desenare
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseout", stopDrawing);

// Touch pentru dispozitive mobile
// canvas.addEventListener("touchstart", (e) => startDrawing(e.touches[0]));
// canvas.addEventListener("touchend", stopDrawing);
// canvas.addEventListener("touchmove", (e) => draw(e.touches[0]));
// canvas.addEventListener("touchcancel", stopDrawing);

function startDrawing(e) {
    drawing = true;
    ctx.beginPath();//creeaza o cale de desenare
    ctx.moveTo(e.offsetX, e.offsetY);//muta pozitia de inceput la coordonatele cursorului
}

function stopDrawing() {
    drawing = false;//opreste desenarea
    ctx.closePath();//finalizeaza calea curenta de desenare
}

//in momentul in care se incepe desenarea
function draw(e) {
    if (!drawing) return;

    ctx.lineWidth = lineWidth;//seteaza dim pensulei
    ctx.strokeStyle = color;//seteaza culoarea pensulei

    ctx.lineTo(e.offsetX, e.offsetY);//traseaza linia catre noua pozitie in care este cursorul
    ctx.stroke();//deseneaza linia pe canvas(tabla)
    ctx.moveTo(e.offsetX, e.offsetY);//actualizeaza punctul de inceput(adica coordonatele in care sa fie linia)
}

// stergerea desenului de pe tabla
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

eraserButton.addEventListener("click", () => {
    eraserActive = !eraserActive;
    color = eraserActive ? getComputedStyle(canvas).backgroundColor : colorPicker.value;
    eraserButton.textContent = eraserActive ? "Desen" : "Eraser";
});


//setarea culorii pensulei
colorPicker.addEventListener("input", (e) => {
    color = e.target.value;
});

//setarea dimensiunii pensulei
brushSize.addEventListener("input", (e) => {
    lineWidth = e.target.value;
});

// Funcționalitatea de chat
sendChatButton.addEventListener("click", () => {
    const userGuess = chatInput.value.trim();
    if (!userGuess) return;

    const message = document.createElement("div");
    if (userGuess.toLowerCase() === generatedWord.toLowerCase()) {
        message.textContent = `Corect! You guessed: ${generatedWord}`;
        message.style.color = "green";
        generateWord();
    } else {
        message.textContent = `Guessed: ${userGuess}`;
        message.style.color = "red";
    }
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
});

// Generăm un cuvânt la început
generateWord();