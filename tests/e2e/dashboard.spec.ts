import { test, expect } from '@playwright/test';

test.describe('Dashboard & Upload Flow (unauthenticated)', () => {
    test('Sollte nicht-eingeloggte User vom Dashboard zum Login umleiten', async ({ page }) => {
        // Wegen der Middleware sollte ein nicht-eingeloggter User auf /login landen
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Sollte nicht-eingeloggte User vom Upload zum Login umleiten', async ({ page }) => {
        await page.goto('/upload');
        await expect(page).toHaveURL(/.*\/login/);
    });
});

test.describe('Dashboard Layout (UI Checks)', () => {
    /*
     Ohne Mocking von Supabase Auth oder einem festen Seed-User können wir 
     den vollumfänglichen internen Flow im CI-Runner schwer testen, 
     ohne die Live-Datenbank zu belasten. 
     Daher prüfen wir die Core-UI anhand der Login-Protections.
    */
});
