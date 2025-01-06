document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault(); // Previne trimiterea formularului

    const emailOrPhone = e.target[0].value;
    const password = e.target[1].value;

    // Validare simpla (poate fi extinsa pentru autentificare reala)
    if (emailOrPhone && password) {
        // Simulează o autentificare reusita si redirectioneaza
        window.location.href = "index.html";
    } else {
        alert("Enter email and password valide!");
    }
});
