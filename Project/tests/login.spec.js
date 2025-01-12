const { test, expect } = require('@playwright/test');

test.describe('Testare Logare', () => {
  // Test pentru logare cu credentiale valide
  test('Logare reusita', async ({ page }) => {
    // Navigheaza la pagina de login
    await page.goto('http://localhost:3000');

    // Completeaza formularul de logare
    await page.fill('input[name="emailOrPhone"]', 'a@a.com'); 
    await page.fill('input[name="password"]', '123');          

    // Trimite formularul
    await page.click('input[type="submit"]');

    // Verifica redirectionarea catre pagina index.html
    //await expect(page).toHaveURL('http://localhost:3000/index.html');

    // Verifica un element specific de pe pagina de succes
    // await expect(page.locator('h1')).toContainText('Welcome'); // inlocuieste cu textul real de pe index.html
  });

//   // Test pentru logare cu credențiale greșite
//   test('Logare eșuată', async ({ page }) => {
//     // Navighează la pagina de login
//     await page.goto('http://localhost:3000');

//     // Completează formularul de logare cu date incorecte
//     await page.fill('input[name="emailOrPhone"]', 'b@b.com');
//     await page.fill('input[name="password"]', '123');

//     // Trimite formularul
//     await page.click('input[type="submit"]');

//     // Verifică afișarea unui mesaj de eroare
//     const alert = page.locator('script:has-text("alert")');
//     await expect(alert).toContainText('You didn\'t write good!'); // Mesajul script-ului din backend
//   });
});
