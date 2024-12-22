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

    if (data.type === "resetTimer") {
        resetTimer(data.timeLimit); // reseteaza timer-ul pe baza timpului primit de la server
    }

//adauga mesajele de la alti utilizatori in chat-ul aplicatiei
if (data.type === "word") {
    // afisarea cuvantului generat
    generatedWordElement.textContent = `Cuvant: ${data.word}`;
}
else
if (data.type === "chat") {
        const chatMessage = document.createElement("div");
        chatMessage.textContent = data.message;
        chatMessages.appendChild(chatMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        //aifsare notificare in momentul in care cineva se conecteaza/deconecteaza
    }  else if (data.type === "draw") {
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

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;

const COLOR_CODES = {
    green: {
        color: "green",
    },
    orange: {
        color: "orange",
        threshold: WARNING_THRESHOLD,
    },
    red: {
        color: "red",
        threshold: ALERT_THRESHOLD,
    },
};

const TIME_LIMIT = 30;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.green.color;

document.getElementById("base-timer-path-remaining").classList.add(remainingPathColor);

startTimer();

function onTimesUp() {
    clearInterval(timerInterval);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timePassed += 1;
        timeLeft = TIME_LIMIT - timePassed;
        document.getElementById("base-timer-label").innerHTML = formatTime(timeLeft);
        setCircleDasharray();
        setRemainingPathColor(timeLeft);

        if (timeLeft === 0) {
            onTimesUp();
        }
    }, 1000);
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function setRemainingPathColor(timeLeft) {
    const { green, orange, red } = COLOR_CODES;
    const remainingPath = document.getElementById("base-timer-path-remaining");

    if (timeLeft <= red.threshold) {
        remainingPath.classList.remove(orange.color);
        remainingPath.classList.add(red.color);
    } else if (timeLeft <= orange.threshold) {
        remainingPath.classList.remove(green.color);
        remainingPath.classList.add(orange.color);
    } else {
        remainingPath.classList.remove(orange.color, red.color);
        remainingPath.classList.add(green.color);
    }
}

function calculateTimeFraction() {
    const rawTimeFraction = timeLeft / TIME_LIMIT;
    return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
    const circleDasharray = `${(
        calculateTimeFraction() * FULL_DASH_ARRAY
    ).toFixed(0)} 283`;
    document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
}

// reseteaza si porneste timer-ul
function resetTimer(newTimeLimit) {
    clearInterval(timerInterval); // opreste timer-ul curent
    timePassed = 0; // reseteaza timpul trecut
    timeLeft = newTimeLimit || TIME_LIMIT; // utilizeaza timpul trimis de server sau valoarea implicita
    remainingPathColor = COLOR_CODES.green.color; // reseteaza culoarea la verde
    document.getElementById("base-timer-path-remaining").className = `base-timer__path-remaining ${remainingPathColor}`;
    document.getElementById("base-timer-label").innerHTML = formatTime(timeLeft); // actualizeaza afisajul timer-ului
    setCircleDasharray(); // actualizeaza progresul grafic
    startTimer(); // porneste un nou timer
}

initializeTimer();
startTimer();