document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault(); // Previne trimiterea formularului

    const username = e.target[0].value;
    const password = e.target[1].value;

    // Validare simpla (poate fi extinsa pentru autentificare reala)
    if (username && password) {
        // Simulează o autentificare reusita si redirectioneaza
        window.location.href = "index.html";
    } else {
        alert("Enter username and password valide!");
    }
});
