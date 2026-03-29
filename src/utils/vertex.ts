import { GoogleGenAI } from '@google/genai';

const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_REGION || 'europe-west3';

// Authentifizierung über Application Default Credentials (ADC) lokal
// oder die oben gesetzte WIF-Konfiguration in der Cloud.
let aiInstance: GoogleGenAI | null = null;

export function getAI() {
    if (aiInstance) return aiInstance;

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_CLOUD_API_KEY ist nicht konfiguriert.');
    }

    console.log('✅ Google AI Client: Initialisiere mit API-Key-Authentifizierung.');

    aiInstance = new GoogleGenAI({
        apiKey: apiKey
    });

    return aiInstance;
}

// Wir nutzen das Modell, das für dein Projekt offiziell verfügbar ist!
export const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Aktuelle Kostenraten für die Berechnung.
 * Preise pro Token in USD.
 */
export const COST_RATES = {
    'gemini-1.5-flash-002': {
        input: 0.000000075, // $0.075 / 1M tokens
        output: 0.0000003,  // $0.30 / 1M tokens
    },
    'gemini-2.5-flash': {
        input: 0.000000075, // Aktueller Preis analog
        output: 0.0000003,
    }
};

/**
 * Berechnet die geschätzten Kosten basierend auf der Token-Nutzung.
 */
export function calculateEstimatedCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates = COST_RATES[model as keyof typeof COST_RATES] || COST_RATES['gemini-2.5-flash'];
    return (inputTokens * rates.input) + (outputTokens * rates.output);
}
