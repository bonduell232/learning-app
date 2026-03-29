import fs from 'fs';

let authInitialized = false;

export function initGoogleAuth() {
    if (authInitialized) return;
    
    // ── Workload Identity Federation (WIF) Setup für Vercel ──
    const wifConfig = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const oidcToken = process.env.VERCEL_OIDC_TOKEN;
    
    if (wifConfig && oidcToken) {
        try {
            const tempDir = '/tmp';
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            // 1. Die WIF-Konfigurationsdatei schreiben
            const configPath = `${tempDir}/gcp-credentials.json`;
            fs.writeFileSync(configPath, wifConfig);
            
            // 2. Das Vercel-Identitäts-Token schreiben (wie im Cloud Portal definiert)
            fs.writeFileSync(`${tempDir}/oidc-token`, oidcToken);
            
            // Google SDKs schauen automatisch in dieser Variable nach dem Pfad zur Config
            process.env.GOOGLE_APPLICATION_CREDENTIALS = configPath;
            console.log('✅ Google Cloud WIF Authentifizierung für Vercel initialisiert.');
        } catch (e) {
            console.error('❌ Fehler beim WIF Config Setup:', e);
        }
    } else {
        // Lokal (ADC): Falls kein WIF vollständig konfiguriert ist
        console.log('ℹ️ Google Cloud nutzt lokale Authentifizierung (ADC).');
    }

    authInitialized = true;
}
