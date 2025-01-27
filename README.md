Interactive Web Drawing Game

Proiectul este un joc web interactiv care permite utilizatorilor să deseneze și să ghicească cuvinte alături de prieteni, oferind o experiență distractivă și competitivă. Jocul este accesibil direct din browser, eliminând necesitatea instalării aplicațiilor. Acesta rezolvă problema lipsei unei platforme rapide și accesibile pentru activități recreative, conectând oameni prin creativitate și competiție.Utilizatorii pot participa la sesiuni de joc în care unul dintre ei desenează un cuvânt primit, iar ceilalți încearcă să-l ghicească într-un timp limitat. Designul intuitiv și interactiv permite o experiență ușor de utilizat, făcând jocul potrivit pentru toate vârstele.

Structura Proiectului

1. Controllers

Conține fișierele pentru logica de control:

authController.js: Gestionează autentificarea utilizatorilor.

serverController.js: Gestionează funcționalitățile serverului.

2. Models

Conține modelul utilizatorilor:

userModel.js: Definește structura datelor utilizatorilor și manipularea acestora.

3. Playwright Report

Folder destinat rapoartelor generate în urma testelor automate efectuate cu Playwright.

4. Public

Conține resursele statice și codul de interfață al aplicației:

Fișiere JavaScript:

GameController.js, GameModel.js, GameView.js: Gestionează logica jocului și interacțiunea utilizatorului.

login.js: Gestionează funcționalitățile paginii de autentificare.

Fișiere HTML:

index.html, login.html, waiting.html: Structura paginilor web.

Fișiere CSS:

login.css, style.css: Stilizarea aplicației.

Fișier JSON:

users.json: Stocarea datelor utilizatorilor.

5. Test Results

Folder pentru stocarea rezultatelor testelor automate.

6. Tests

Include fișiere de testare și exemple pentru validarea funcționalităților aplicației, contribuind la asigurarea calității codului.

7. Fișiere la rădăcina proiectului

server.js și server1.js: Fișiere care definesc serverul aplicației, gestionând conexiunile și interacțiunile dintre client și server.

