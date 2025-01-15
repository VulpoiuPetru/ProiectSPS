document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Previne trimiterea formularului

    const username = e.target[0].value;
    const password = e.target[1].value;

    if (username && password) {
    try {
        // Citește JSON-ul cu utilizatori
        const response = await fetch("users.json");
        if (!response.ok) {
            throw new Error("Eroare la încărcarea fișierului JSON");
        }

        const users = await response.json();

        // Verifică dacă există un utilizator cu acest username și parolă
        const userExists = users.some(user => user.username === username && user.password === password);

        if (userExists) {
            // Redirecționare la index.html în cazul autentificării reușite
            window.location.href = "index.html";
        } else {
            alert("Username sau parola incorectă!");
        }
    } catch (error) {
        console.error("Eroare:", error);
        alert("A apărut o eroare. Încearcă din nou mai târziu.");
    }
} else {
    alert("Introduceți un username și o parolă valide!");
}
});
