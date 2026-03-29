import fs from 'fs';

let authInitialized = false;

export function initGoogleAuth() {
    if (authInitialized) return;
    
    // ── Workload Identity Federation (WIF) Setup für Cloud (z.B. Vercel) ──
    if (process.env.GCP_WIF_CONFIG && process.env.VERCEL_OIDC_TOKEN) {
        try {
            if (!fs.existsSync('/tmp')) fs.mkdirSync('/tmp', { recursive: true });
            
            fs.writeFileSync('/tmp/wif-config.json', process.env.GCP_WIF_CONFIG);
            fs.writeFileSync('/tmp/oidc-token', process.env.VERCEL_OIDC_TOKEN);
            
            process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
        } catch (e) {
            console.error('Fehler beim Setup der Cloud-Authentifizierung (WIF):', e);
        }
    }

    authInitialized = true;
}
