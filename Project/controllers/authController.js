const fs = require("fs");
const path = require("path");

exports.signup = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    const usersFilePath = path.join(__dirname, "../public/users.json");
    fs.readFile(usersFilePath, "utf8", (err, data) => {
        let users = [];
        if (!err) {
            try {
                users = JSON.parse(data) || [];
            } catch (parseError) {
                return res.status(500).send("Eroare server.");
            }
        }

        if (users.find(user => user.username === username)) {
            return res.send(`<script>alert('Username is already signed!'); window.location='/';</script>`);
        }

        users.push({ username, password });
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) return res.status(500).send("Eroare server.");
            res.send(`<script>alert('Success signed!'); window.location='/';</script>`);
        });
    });
};

exports.login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    const usersFilePath = path.join(__dirname, "../public/users.json");
    fs.readFile(usersFilePath, "utf8", (err, data) => {
        if (err) return res.status(500).send("Eroare server.");
        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).send("Eroare server.");
        }

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            return res.redirect("/index.html");
        } else {
            return res.send(`<script>alert('Invalid credentials!'); window.location='/';</script>`);
        }
    });
};