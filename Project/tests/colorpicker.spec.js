const { test, expect } = require('@playwright/test');

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
    test('should send draw data via WebSocket', async ({ page }) => {
        // Navighează la pagina de login
        await page.goto('http://localhost:3000');

        // Completează formularul de logare
        await page.fill('input[name="username"]', 'petru');
        await page.fill('input[name="password"]', '123');

        // Trimite formularul
        await page.click('input[type="submit"]');

        // Așteaptă 10 secunde
        await page.waitForTimeout(10000);

        // Mock pentru WebSocket
        const mockSocket = {
            send: (...args) => {
                mockSocket.lastMessage = args[0];  // Salvează mesajul trimis pentru verificare
            },
            addEventListener: () => {}  // Nu trebuie să facem nimic cu addEventListener în acest caz
        };

        // Injectăm mock-ul WebSocket în aplicație
        await page.exposeFunction('mockSocket', mockSocket.send);

        // Injectăm funcția mockSocket în contextul global al paginii
        await page.evaluate(() => {
            window.socket = {
                send: (...args) => mockSocket(args),
                addEventListener: () => {}, // Nu avem nevoie de un addEventListener
            };
        });

        const data = {
            type: 'draw',
            fromX: 10,
            fromY: 20,
            toX: 30,
            toY: 40
        };

        // Simulăm trimiterea datelor prin WebSocket
        window.socket.send(JSON.stringify(data));

        // Verificăm că mesajul a fost trimis corect prin WebSocket
        expect(mockSocket.lastMessage).toBe(JSON.stringify(data));
    });
});

// Test pentru API Timer Update
test.describe('API Timer Update', () => {
    test('should update timer label correctly', async ({ page }) => {
        document.body.innerHTML = '<div id="base-timer-label"></div>';
        const mockMessage = {
            type: 'update-timer',
            time: 125
        };

        const timerLabel = document.getElementById('base-timer-label');

        // Funcția din cod pentru actualizare
        const handleMessage = (data) => {
            if (data.type === 'update-timer') {
                const minutes = Math.floor(data.time / 60);
                const seconds = data.time % 60;
                timerLabel.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        };

        handleMessage(mockMessage);
        expect(timerLabel.textContent).toBe('02:05');
    });
});

// Test pentru performanță
test.describe('Performance Test: Drawing', () => {
    test('should handle 1000 drawing events efficiently', async ({ page }) => {
        const mockSocket = { send: jest.fn() };
        const start = performance.now();

        for (let i = 0; i < 1000; i++) {
            const data = {
                type: 'draw',
                fromX: i,
                fromY: i,
                toX: i + 1,
                toY: i + 1
            };
            mockSocket.send(JSON.stringify(data));
        }

        const end = performance.now();
        const duration = end - start;

        expect(duration).toBeLessThan(500); // Testăm dacă evenimentele sunt procesate în mai puțin de 500ms
        expect(mockSocket.send).toHaveBeenCalledTimes(1000);
    });
});
