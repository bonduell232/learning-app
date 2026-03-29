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
      GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY ? 'Vorhanden (OK)' : 'FEHLT (Bitte in Vercel als GOOGLE_CLOUD_API_KEY hinzufügen)',
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'Vorhanden',
      MODE: 'API-KEY (Direkt)'
    };

    return NextResponse.json({
      status: 'success',
      message: '✅ Verbindung zu Google Cloud steht! API-Key Authentifizierung ist aktiv.',
      voicesCount: response.voices?.length || 0,
      envDebug: debugInfo
    });
  } catch (error: any) {
    console.error('❌ Diagnose-Fehler:', error);
    
    // Debug-Info auch im Fehlerfall berechnen
    const errorDebugInfo = {
      GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY ? 'Vorhanden (OK)' : 'FEHLT',
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'Vorhanden',
      MODE: 'API-KEY (Direkt)'
    };

    return NextResponse.json({
      status: 'error',
      message: '❌ Verbindung fehlgeschlagen: ' + error.message,
      hint: 'Prüfe, ob die APIs (Generative Language & TTS) in der GCP Console aktiviert sind.',
      envDebug: errorDebugInfo
    }, { status: 500 });
  }
}
