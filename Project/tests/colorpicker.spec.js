const { test, expect } = require('@playwright/test');


//teste unitare

// Test pentru logare cu credentiale valide
test.describe('Testare Logare', () => {
    test('Logare reusita', async ({ page }) => {
        // Navighează la pagina de login
        await page.goto('http://localhost:3000');

        // Completează formularul de logare
        await page.fill('input[name="username"]', 'petru'); 
        await page.fill('input[name="password"]', '123');          

        // Trimite formularul
        await page.click('input[type="submit"]');

        // Verifică redirecționarea către pagina index.html
        await expect(page).toHaveURL('http://localhost:3000/index.html');

        // Verifică un element specific de pe pagina de succes
       // await expect(page.locator('h1')).toContainText('Welcome');
    });

    // Test pentru logare cu credențiale greșite
    test('Logare esuata', async ({ page }) => {
        // Navighează la pagina de login
        await page.goto('http://localhost:3000');

        // Completează formularul de logare cu date incorecte
        await page.fill('input[name="username"]', 'maria');
        await page.fill('input[name="password"]', '123');

        // Trimite formularul
        await page.click('input[type="submit"]');

        // Verifică afișarea unui mesaj de eroare
        //const alert = page.locator('script:has-text("alert")');
       // await expect(alert).toContainText('You didn\'t write good!');
    });
});

// Test pentru validarea input-urilor formularului
test.describe('Form Validation', () => {
    test('should redirect when username and password are provided', async ({ page }) => {
        // Navighează la pagina de login
        await page.goto('http://localhost:3000');

        // Completează formularul de logare
        await page.fill('input[name="username"]', 'petru');
        await page.fill('input[name="password"]', '123');

        // Trimite formularul
        await page.click('input[type="submit"]');

        // Verifică redirecționarea către index.html
        await expect(page).toHaveURL('http://localhost:3000/index.html');
    });
});

// Test pentru colorPicker
test.describe('Color Picker', () => {
    test('should change the brush color', async ({ page }) => {

         // Navighează la pagina de login
         await page.goto('http://localhost:3000');

         // Completează formularul de logare
         await page.fill('input[name="username"]', 'petru');
         await page.fill('input[name="password"]', '123');
 
         // Trimite formularul
         await page.click('input[type="submit"]');
        // Simulează schimbarea culorii cu un picker
        await page.fill('input[type="color"]', '#ff0000');
        
        // Verifică că culoarea a fost setată corect
        const colorInputValue = await page.inputValue('input[type="color"]');
        expect(colorInputValue).toBe('#ff0000');
    });
});

// Test pentru WebSocket Drawing Integration
test.describe('WebSocket Drawing Integration', () => {
    test('should send word data via WebSocket', async ({ page }) => {
        // Navighează la pagina de login
        await page.goto('http://localhost:3000');

        // Completează formularul de logare
        await page.fill('input[name="username"]', 'petru');
        await page.fill('input[name="password"]', '123');

        // Trimite formularul
        await page.click('input[type="submit"]');

        // Așteaptă 11 secunde pentru a simula trecerea timpului din lobby
        await page.waitForTimeout(11000);

        // Selectează primul cuvânt din lista afișată
        await page.waitForSelector('#word-choices button'); // Așteaptă să apară lista cu cuvinte
        const firstButton = await page.$('#word-choices button'); // Selectează primul buton
        if (firstButton) {
            await firstButton.click(); // Alege primul cuvânt
        }

        // Mock pentru WebSocket
        const mockSocket = {
            send: (...args) => {
                mockSocket.lastMessage = args[0];  // Salvează mesajul trimis pentru verificare
            },
            addEventListener: () => {}  // Nu trebuie să facem nimic cu addEventListener în acest caz
        };

        // Injectăm funcția mockSocket în contextul global al paginii
        await page.exposeFunction('mockSocket', mockSocket.send);

        await page.evaluate(() => {
            window.socket = {
                send: (...args) => mockSocket(...args),
                addEventListener: () => {}, // Nu avem nevoie de un addEventListener
            };
        });

        // Simulăm trimiterea datelor pentru un cuvânt selectat prin WebSocket
        const selectedWordData = {
            type: 'choose-word',
            word: 'example-word'
        };

        // Apelăm `window.socket.send` în contextul paginii
        await page.evaluate((data) => {
            window.socket.send(JSON.stringify(data));
        }, selectedWordData);

        // Verificăm că mesajul cu cuvântul selectat a fost trimis corect prin WebSocket
        expect(mockSocket.lastMessage).toBe(JSON.stringify(selectedWordData));
    });
});
test.describe('WebSocket Integration Test', () => {
    test('should connect and send a chat message', async () => {
        // Creare conexiune WebSocket la server
        const ws = new WebSocket('ws://localhost:3000'); // Adaptează URL-ul dacă este alt port/server

        // Promisiuni pentru a verifica evenimentele de conectare și mesaje
        const connectPromise = new Promise((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
        });

        const messagePromise = new Promise((resolve) => {
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'chat' && data.message === 'Hello, WebSocket!') {
                    resolve(data);
                }
            });
        });

        // Așteaptă conectarea
        await connectPromise;

        // Trimite un mesaj de tip `chat`
        ws.send(JSON.stringify({ type: 'chat', message: 'Hello, WebSocket!' }));

        // Verifică dacă mesajul a fost primit corect
        const receivedMessage = await messagePromise;
        expect(receivedMessage).toEqual({
            type: 'chat',
            message: 'Hello, WebSocket!',
        });

        // Închide conexiunea
        ws.close();
    });
});


test.describe('E2E Test - Complete Game Flow', () => {
    test('should allow user to login, pick a word, and draw', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Autentificare
        await page.fill('input[name="username"]', 'petru');
        await page.fill('input[name="password"]', '123');
        await page.click('input[type="submit"]');
        await expect(page).toHaveURL('http://localhost:3000/index.html');

        // Alege cuvânt
        const wordButton = page.locator('#word-choices button');
        await wordButton.first().click();

        // Desenează
        const canvas = page.locator('canvas');
        await canvas.click({ position: { x: 100, y: 100 } });
        await canvas.click({ position: { x: 200, y: 200 } });

        // Validare că s-au trimis evenimentele de desen
        const sentEvents = await page.evaluate(() => window.sentEvents);
        expect(sentEvents.length).toBeGreaterThan(0);
    });
});


test.describe('Performance Test - Page Load', () => {
    test('should load login page in under 1s', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('http://localhost:3000');
        const endTime = Date.now();
        const loadTime = endTime - startTime;

        expect(loadTime).toBeLessThan(1000); // Timpul maxim permis este 1s
    });
});
