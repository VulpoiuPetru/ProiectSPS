const userModel = require("../models/userModel");

exports.signup = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    try {
        // Verifică dacă utilizatorul există deja
        const user = await userModel.findUserByUsername(username);
        if (user) {
            return res.send(`<script>alert('Username is already signed!'); window.location='/';</script>`);
        }

        // Adaugă utilizatorul în baza de date
        await userModel.addUser(username, password);
        res.send(`<script>alert('Success signed!'); window.location='/';</script>`);
    } catch (err) {
        console.error("Eroare la baza de date:", err);
        res.status(500).send("Eroare server.");
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(`<script>alert('Fill all fields!'); window.location='/';</script>`);
    }

    try {
        const user = await userModel.findUserByUsername(username);
        if (user && user.password === password) {
            return res.redirect("/index.html");
        } else {
            return res.send(`<script>alert('Invalid credentials!'); window.location='/';</script>`);
        }
    } catch (err) {
        console.error("Eroare la baza de date:", err);
        res.status(500).send("Eroare server.");
    }
};
