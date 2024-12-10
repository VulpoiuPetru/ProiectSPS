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

//conectare la websocket
const socket =new WebSocket("ws://localhost:3000");

// // Lista de cuvinte
// const words = ["floare", "masina", "soare", "pisica", "casa"];
// let generatedWord = ""

// // Functia pentru generarea unui cuvant
// function generateWord() {
//     generatedWord = words[Math.floor(Math.random() * words.length)];
//     const hiddenWord = "_".repeat(generatedWord.length);
//     generatedWordElement.textContent = `Cuvânt: ${hiddenWord}`;
// }

// functiile pt desenare
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    ctx.beginPath();//creeaza o cale de desenare
    ctx.moveTo(e.offsetX, e.offsetY);//muta pozitia de inceput la coordonatele cursorului
    socket.send(JSON.stringify({ type: "start", x: e.offsetX, y: e.offsetY }));//transmite datele catre server
});

canvas.addEventListener("mouseup", () => {
    if (drawing) {
        drawing = false;//opreste desenarea
        ctx.closePath();//finalizeaza calea curenta de desenare
        socket.send(JSON.stringify({ type: "stop" }));//transmite datele catre server
    }
});
//aici este in momentul in care mouse-ul depaseste zona de desenare
canvas.addEventListener("mouseout", () => {
    if (drawing) {
        drawing = false;
        ctx.closePath();
        socket.send(JSON.stringify({ type: "stop" }));
    }
});

//in momentul in care se incepe desenarea
canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.lineWidth = lineWidth;//seteaza dim pensulei
    ctx.strokeStyle = color;//seteaza culoarea pensulei
    ctx.lineTo(e.offsetX, e.offsetY);//traseaza linia catre noua pozitie in care este cursorul
    ctx.stroke();
    socket.send(
        JSON.stringify({
            type: "draw",
            x: e.offsetX,
            y: e.offsetY,
            color: ctx.strokeStyle,
            lineWidth: ctx.lineWidth,
        })
    );
});


 // stergerea desenului de pe tabla
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);//sterge tot continutul in care se deseneaza
    socket.send(JSON.stringify({ type: "clear" }));//trimite semna de stergere catre server
});

eraserButton.addEventListener("click", () => {
    eraserActive = !eraserActive;//inverseaza starea gumei(adica dc este guma sau desen)
    color = eraserActive ? getComputedStyle(canvas).backgroundColor : colorPicker.value;//seteaza culoarea pe cea de fundal sau culoarea setata
    eraserButton.textContent = eraserActive ? "Desen" : "Eraser";//actualizeaza mesajul din html pt buton
});

//setarea culorii pensulei
colorPicker.addEventListener("input", (e) => (color = e.target.value));
//setarea dimensiunii pensulei
brushSize.addEventListener("input", (e) => (lineWidth = e.target.value));

// functiona de chat
sendChatButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: "chat", message }));//trimite mesaj catre server
        chatInput.value = "";//goleste campul deintrare
    }
});


//aici face transmiterea catre server cu websocket
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
//adauga mesajele de la alti utilizatori in chat-ul aplicatiei
    if (data.type === "chat") {
        const chatMessage = document.createElement("div");
        chatMessage.textContent = data.message;
        chatMessages.appendChild(chatMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        //aifsare notificare in momentul in care cineva se conecteaza/deconecteaza
    } else if (data.type === "system") {
        const systemMessage = document.createElement("div");
        systemMessage.textContent = data.message;
        chatMessages.appendChild(systemMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
       //transmiterea catre clienti in cazul in care se deseneaza 
    } else if (data.type === "draw") {
        ctx.lineWidth = data.lineWidth;
        ctx.strokeStyle = data.color;
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
    } else if (data.type === "start") {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    } else if (data.type === "stop") {
        ctx.closePath();
    } else if (data.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

//generateWord();