import fs from 'fs';

let authInitialized = false;

export function initGoogleAuth() {
    if (authInitialized) return;
    
    // Wir nutzen ab jetzt API-Keys für alle Google Cloud Dienste.
    // WIF/ADC wird damit obsolet für Pocklio auf Vercel.
    console.log('ℹ️ Google Cloud nutzt API-Key Authentifizierung.');
    
    authInitialized = true;
}
