import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('Sollte auf die Login-Seite zugreifen können', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('h1')).toContainText('Willkommen');
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('Sollte einen Fehler bei falschen Zugangsdaten anzeigen', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'invalid@beispiel.de');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Erwartet, dass ein Fehler angezeigt wird (Supabase Auth Fehler)
        await expect(page.locator('.text-red-400, .bg-red-500')).toBeVisible({ timeout: 10000 });
    });

    /* 
    Happy Path Test wurde vorübergehend deaktiviert, um nicht jedes Mal reale Mails an Supabase zu schicken.
    In CI sollte hierfür ein Seed-Test-User (z.B. test@beispiel.de) verwendet werden.
    */
});
