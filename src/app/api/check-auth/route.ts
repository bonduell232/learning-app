import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { initGoogleAuth } from '@/utils/gcpAuth';
import tts from '@google-cloud/text-to-speech';

export async function GET() {
  try {
    console.log('🔍 Starte WIF Diagnose...');
    
    // Initialisiere die Authentifizierung (WIF / ADC)
    initGoogleAuth();
    
    // Teste die Verbindung durch Abruf der Stimmenliste
    const client = new tts.TextToSpeechClient();
    const [response] = await client.listVoices({});
    
    const debugInfo = {
      GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'Vorhanden (OK)' : 'FEHLT (Bitte in Vercel hinzufügen)',
      VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN ? 'Vorhanden (OK)' : 'FEHLT (Bitte "Enable OIDC" in Vercel Security aktivieren)',
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'FEHLT',
      CURRENT_CREDENTIALS_PATH: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Nicht gesetzt'
    };

    return NextResponse.json({
      status: 'success',
      message: '✅ Verbindung zu Google Cloud steht! OIDC/WIF ist korrekt konfiguriert.',
      voicesCount: response.voices?.length || 0,
      envDebug: debugInfo
    });
  } catch (error: any) {
    console.error('❌ Diagnose-Fehler:', error);
    
    // Debug-Info auch im Fehlerfall berechnen
    const debugInfo = {
      GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'Vorhanden (OK)' : 'FEHLT (Bitte in Vercel hinzufügen)',
      VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN ? 'Vorhanden (OK)' : 'FEHLT (Bitte "Enable OIDC" in Vercel Security aktivieren)',
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'FEHLT',
      CURRENT_CREDENTIALS_PATH: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Nicht gesetzt'
    };

    return NextResponse.json({
      status: 'error',
      message: '❌ Verbindung fehlgeschlagen: ' + error.message,
      hint: 'Prüfe, ob "Enable OIDC" in Vercel aktiv ist und die Pool-ID in Google Cloud stimmt.',
      envDebug: debugInfo
    }, { status: 500 });
  }
}
