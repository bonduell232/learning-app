import { test, expect } from '@playwright/test';

test.describe.skip('Multi-Image Upload & Grouping Flow', () => {
    /* 
     Dieser Test ist standardmäßig übersprungen (.skip), bis ein fester 
     E2E-Test-User (Seed) in der Supabase-Datenbank konfiguriert ist, 
     da die Authentifizierung serverseitig JWT-gesichert ist und nicht 
     trivial im Browser gemockt werden kann.
    */

    test('Sollte mehrere Bilder hochladen und als Gruppe (COLLECTION) zusammenfassen', async ({ page }) => {
        // 1. Login mit Test-User
        await page.goto('/login');
        await page.fill('input[type="email"]', 'e2e-testuser@example.com');
        await page.fill('input[type="password"]', 'e2e-test-password-123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

        // 2. Navigation zum Upload
        await page.goto('/upload');
        await expect(page.locator('text=Ordner ablegen')).toBeVisible();

        // 3. Bilder auswählen (Mocking File Chooser)
        // Hinweis: Wir gehen davon aus, dass Dummy-Dateien unter tests/fixtures/ liegen.
        /*
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('label').click(); // Dropzone Klick
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles([
            'tests/fixtures/test-image-1.jpg',
            'tests/fixtures/test-image-2.jpg'
        ]);
        */

        // 4. Upload & KI-Verarbeitung starten
        // await page.click('button:has-text("Dateien hochladen")');

        // 5. Confirmation Step prüfen
        // await expect(page.locator('text=KI-Vorschläge prüfen')).toBeVisible({ timeout: 20000 });

        // Prüfen, ob die Gemini-KI eine Bild-Gruppe erstellt hat
        // await expect(page.locator('text=Bild-Gruppe')).toBeVisible();
        // await expect(page.locator('text=2 Bilder')).toBeVisible();

        // 6. Speichern und Abschließen
        // await page.click('button:has-text("Speichern & Weiter")');

        // 7. Weiterleitung zur Learn-Seite prüfen (Prüft den Redirect nach der DB-Speicherung)
        // await expect(page).toHaveURL(/.*\/learn\/.*/, { timeout: 15000 });
    });
});
