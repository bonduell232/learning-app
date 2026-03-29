import textToSpeech from '@google-cloud/text-to-speech';

// Wir nutzen nun den universellen API-Key für die Authentifizierung.
const client = new textToSpeech.TextToSpeechClient({
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});

/**
 * Wandelt Text in hochqualitatives Audio um (Journey/Studio Stimmen).
 * @param text Der zu sprechende Fließtext
 * @param isConversation Wenn true, können wir eine dynamischere Stimme nutzen
 * @returns MP3 Datei als Buffer
 */
export async function generateHighQualityAudio(text: string, isConversation: boolean = false): Promise<Buffer> {
    // Falls conversation true ist, nehmen wir eine andere, passendere Stimme
    // Die Journey Voices sind aktuell das Beste was Google auf Deutsch hat.
    const voiceName = isConversation ? 'de-DE-Journey-O' : 'de-DE-Journey-F'; 

    const request = {
        input: { text: text },
        // Select the language and SSML voice feature (optional)
        voice: { languageCode: 'de-DE', name: voiceName },
        // select the type of audio encoding
        audioConfig: { 
            audioEncoding: 'MP3' as const,
            speakingRate: 1.05, // Leicht flüssiger
            pitch: 0.0,
        },
    };

    // Führt die TTS API-Anfrage aus
    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
        throw new Error('Google TTS hat kein AudioContent zurückgegeben.');
    }

    return Buffer.from(response.audioContent);
}
