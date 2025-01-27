const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const WebSocket = require("ws");

const authController = require("./controllers/authController");
const serverController = require("./controllers/serverController");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Configurare rute
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.post("/signup", authController.signup);
app.post("/login", authController.login);
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.use(express.static("public"));

// Server HTTP și WebSocket
const server = app.listen(3000, () => {
    console.log(`Serverul rulează la: http://localhost:3000`);
});
const wss = new WebSocket.Server({ server });
gameController.initWebSocket(wss);