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
    
    return NextResponse.json({
      status: 'success',
      message: '✅ Verbindung zu Google Cloud steht! OIDC/WIF ist korrekt konfiguriert.',
      voicesCount: response.voices?.length || 0,
      envCheck: {
        hasJson: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
        hasOidc: !!process.env.VERCEL_OIDC_TOKEN,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      }
    });
  } catch (error: any) {
    console.error('❌ Diagnose-Fehler:', error);
    return NextResponse.json({
      status: 'error',
      message: '❌ Verbindung fehlgeschlagen: ' + error.message,
      hint: 'Prüfe, ob "Enable OIDC" in Vercel aktiv ist und die Pool-ID in Google Cloud stimmt.'
    }, { status: 500 });
  }
}
