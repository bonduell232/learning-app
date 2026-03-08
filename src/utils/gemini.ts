import { GoogleGenAI } from '@google/genai'

export interface Flashcard {
    front: string
    back: string
}

export interface QuizQuestion {
    question: string
    options: string[]
    correct_index: number
    explanation: string
}

const SYSTEM_PROMPT = `Du bist ein hilfreicher Lernassistent für Schülerinnen und Schüler ab der 5. Klasse.
Deine Aufgabe ist es, aus dem gegebenen Lernmaterial präzise Karteikarten zu erstellen.

Regeln:
- Erstelle zwischen 8 und 20 Karteikarten, je nach Umfang des Materials.
- Jede Karteikarte hat eine kurze, klare FRAGE (Vorderseite) und eine knackige ANTWORT (Rückseite).
- Formuliere alles auf Deutsch, kindgerecht und verständlich.
- Fokussiere dich auf die wichtigsten Begriffe, Fakten und Zusammenhänge.
- Antworte NUR mit einem validen JSON-Array im folgenden Format, ohne Erklärungen davor oder danach:
[{"front": "Frage 1", "back": "Antwort 1"}, {"front": "Frage 2", "back": "Antwort 2"}]`

function getClient(): GoogleGenAI {
    const apiKey = process.env.NOTEBOOKLM_API_KEY
    if (!apiKey) throw new Error('NOTEBOOKLM_API_KEY ist nicht gesetzt.')
    return new GoogleGenAI({ apiKey })
}

function parseFlashcards(rawText: string): Flashcard[] {
    // JSON aus der Antwort extrahieren (falls Gemini etwas drumherum schreibt)
    const match = rawText.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Gemini hat kein gültiges JSON zurückgegeben.')
    const cards: Flashcard[] = JSON.parse(match[0])
    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error('Keine Karteikarten im Gemini-Response gefunden.')
    }
    return cards.map(c => ({
        front: String(c.front ?? '').trim(),
        back: String(c.back ?? '').trim(),
    })).filter(c => c.front && c.back)
}

/**
 * Generiert Karteikarten aus reinem Text (z.B. extrahierter Word-Inhalt).
 */
export async function generateFlashcardsFromText(
    text: string,
    title: string
): Promise<Flashcard[]> {
    const client = getClient()
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: SYSTEM_PROMPT },
                    { text: `\n\nDokumenttitel: "${title}"\n\nInhalt:\n${text.slice(0, 50000)}` },
                ],
            },
        ],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseFlashcards(raw)
}

/**
 * Generiert Karteikarten aus einer Binärdatei (PDF oder Bild) via Gemini Multimodal.
 */
export async function generateFlashcardsFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    title: string
): Promise<Flashcard[]> {
    const client = getClient()
    const base64Data = fileBuffer.toString('base64')

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: SYSTEM_PROMPT },
                    { text: `\n\nDokumenttitel: "${title}"\n\nErstelle Karteikarten aus dem folgenden Dokument:` },
                    {
                        inlineData: {
                            mimeType,
                            data: base64Data,
                        },
                    },
                ],
            },
        ],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseFlashcards(raw)
}

// ─── Podcast ─────────────────────────────────────────────────────────────────

const PODCAST_PROMPT = `Du bist ein freundlicher Lernbegleiter für Schülerinnen und Schüler ab der 5. Klasse.
Erstelle aus dem Lernmaterial einen kurzen, lebendigen Lern-Podcast-Text auf Deutsch.

Struktur:
1. Kurzes Intro (1 Satz, z.B. "Hey! Heute lernst du alles über ...")
2. Die 5 bis 8 wichtigsten Lerninhalte, je in 2–3 klar formulierten Sätzen
3. Abschließender Lerntipp (1 Satz)

Wichtig: Schreib so, als würdest du mit deinem besten Freund sprechen. Keine Schachtelsätze.
Gib NUR den Fließtext zurück, keine Kapitelüberschriften oder Formatierung.`

export async function generatePodcastScriptFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    title: string
): Promise<string> {
    const client = getClient()
    const base64Data = fileBuffer.toString('base64')
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: PODCAST_PROMPT },
                { text: `\n\nDokumenttitel: "${title}"` },
                { inlineData: { mimeType, data: base64Data } },
            ],
        }],
    })
    return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

export async function generatePodcastScriptFromText(
    text: string,
    title: string
): Promise<string> {
    const client = getClient()
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: PODCAST_PROMPT },
                { text: `\n\nDokumenttitel: "${title}"\n\nInhalt:\n${text.slice(0, 50000)}` },
            ],
        }],
    })
    return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

const QUIZ_PROMPT = `Du bist ein Lehrer, der einen Wissenstest erstellt.
Erstelle 8 bis 12 Multiple-Choice-Fragen auf Deutsch für Schülerinnen und Schüler ab der 5. Klasse.

Jede Frage hat:
- eine klare Frage
- exakt 4 Antwortoptionen (A bis D), davon genau eine richtig
- den Index der richtigen Antwort (0 = erste Option)
- eine kurze, kindgerechte Erklärung warum die Antwort richtig ist (1 Satz)

Antworte NUR mit einem validen JSON-Array, ohne Erklärungen davor oder danach:
[{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}]`

function parseQuizQuestions(rawText: string): QuizQuestion[] {
    const match = rawText.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Kein gültiges JSON in der Quiz-Antwort.')
    const questions: QuizQuestion[] = JSON.parse(match[0])
    return questions.filter(q =>
        q.question && Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correct_index === 'number'
    )
}

export async function generateQuizQuestionsFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    title: string
): Promise<QuizQuestion[]> {
    const client = getClient()
    const base64Data = fileBuffer.toString('base64')
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: QUIZ_PROMPT },
                { text: `\n\nDokumenttitel: "${title}"` },
                { inlineData: { mimeType, data: base64Data } },
            ],
        }],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseQuizQuestions(raw)
}

export async function generateQuizQuestionsFromText(
    text: string,
    title: string
): Promise<QuizQuestion[]> {
    const client = getClient()
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: QUIZ_PROMPT },
                { text: `\n\nDokumenttitel: "${title}"\n\nInhalt:\n${text.slice(0, 50000)}` },
            ],
        }],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseQuizQuestions(raw)
}
