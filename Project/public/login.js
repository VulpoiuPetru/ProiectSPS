document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Previne trimiterea formularului

    const username = e.target[0].value;
    const password = e.target[1].value;

    if (username && password) {
        try {
            // Trimite datele către backend pentru autentificare
            const response = await fetch("http://localhost:3000/login", { // Adresa backend-ului
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                // Autentificare reușită - redirecționează utilizatorul
                window.location.href = "index.html";
            } else {
                // Afișează eroarea primită de la server
                const errorData = await response.json();
                alert(errorData.message || "Username sau parola incorectă!");
            }
        } catch (error) {
            console.error("Eroare:", error);
            alert("A apărut o eroare. Încearcă din nou mai târziu.");
        }
    } else {
        alert("Introduceți un username și o parolă valide!");
    }git
    
});
