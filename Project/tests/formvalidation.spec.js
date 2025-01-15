const { test, expect } = require('@playwright/test');

// Test pentru validarea input-urilor formularului
test.describe('Form Validation', () => {
    test('should redirect when username and password are provided', async ({ page }) => {
        // Navighează la pagina cu formularul
        await page.goto('http://localhost:3000'); // Înlocuiește cu URL-ul aplicației tale

        // Completează câmpurile formularului
        await page.fill('input[name="username"]', 'tommy'); // Selector pentru username
        await page.fill('input[name="password"]', '123'); // Selector pentru password

        // Trimite formularul
        await page.click('input[type="submit"]'); // Selector pentru butonul de submit

         // Așteaptă ca elementul să fie vizibil
         const lobbyContainer = page.locator('#lobby-container');
         await expect(lobbyContainer).toBeVisible();
 
         // Verifică dacă mesajul din lobby este cel așteptat
         const lobbyMessage = await page.locator('#lobby-message').innerText();
         expect(lobbyMessage).toBe('Ești în lobby. Așteaptă să înceapă jocul...');
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
