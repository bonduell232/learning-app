require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = 'europe-west3';

const ai = new GoogleGenAI({
    vertexai: true,
    project: project,
    location: location,
});

async function run() {
    console.log(`Test läuft für Projekt: ${project} in ${location}...`);
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Antworte mit exakt einem Wort: ERFOLG',
        });
        console.log('✅ TEST ERFOLGREICH!');
        console.log('Antwort der KI:', result.text);
    } catch (error) {
        console.error('❌ TEST FEHLGESCHLAGEN:');
        console.error(error.message);
    }
}

run();
