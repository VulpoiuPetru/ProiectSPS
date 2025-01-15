const { test, expect } = require('@playwright/test');

// Test pentru validarea input-urilor formularului
test.describe('Form Validation', () => {
    test('should redirect when username and password are provided', async ({ page }) => {
        // Navighează la pagina cu formularul
        await page.goto('http://localhost:3000'); // Înlocuiește cu URL-ul aplicației tale

        // Completează câmpurile formularului
        await page.fill('input[name="username"]', 'user'); // Selector pentru username
        await page.fill('input[name="password"]', 'pass'); // Selector pentru password

        // Trimite formularul
        await page.click('input[type="submit"]'); // Selector pentru butonul de submit

        // Așteaptă redirecționarea
        await page.waitForURL('http://localhost:3000/index.html'); // Înlocuiește cu URL-ul de redirecționare

        // Verifică URL-ul paginii curente
        expect(page.url()).toBe('http://localhost:3000/index.html');
    });

    test('should show an alert when username or password is missing', async ({ page }) => {
        // Navighează la pagina cu formularul
        await page.goto('http://localhost:3000'); // Înlocuiește cu URL-ul aplicației tale

        // Lăsă câmpurile goale și trimite formularul
        await page.click('input[type="submit"]');

        // Interceptează și verifică mesajul alert
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toBe('Enter username and password valide!');
            await dialog.dismiss(); // Închide dialogul
        });
    });
});
