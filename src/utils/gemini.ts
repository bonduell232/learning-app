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

export interface SubjectDetection {
    subject: string   // z.B. "Geografie", "Mathematik", "Biologie"
    topic: string     // z.B. "Südamerika", "Quadratische Gleichungen"
    context_info: string // z.B. "Arbeitsblatt vom 12.05.", "Buchseite 34", "Hefteintrag"
    confidence: 'high' | 'low'
}

export interface ImageGroup {
    id: string
    title: string
    subject: string
    topic: string
    imageIndices: number[]
    reasoning: string
}


const SUBJECT_DETECTION_PROMPT = `Du bist ein intelligenter Assistent für deutsche Schüler der Klassen 5–12.
Analysiere das gegebene Lernmaterial und erkenne:
1. Das Schulfach (z.B. Geografie, Mathematik, Biologie, Geschichte, Medizin, Physik, Chemie, Deutsch, Sprachaufenthalt, Englisch, Kunst, Sport)
2. Das konkrete Thema innerhalb des Fachs (z.B. "Südamerika", "Quadratische Gleichungen", "Fotosynthese")
3. Kontext und Zusatzangaben (Suche in Text nach Datum, Typ des Materials wie z.B. "Arbeitsblatt", "Hefteintrag", "Buchseite 12". Formuliere es kurz und knapp als Tag-String, z.B. "Arbeitsblatt vom 12.05.2024" oder "Hefteintrag". Falls nichts ersichtlich ist, lasse es leer "")

Antworte NUR mit einem JSON-Objekt ohne Erklärungen:
{"subject": "Fachname", "topic": "Thema", "context_info": "Extrahierte Zusatzinfos oder leer", "confidence": "high"}

Falls du dir unsicher bist, setze confidence auf "low".
Gib immer einen sinnvollen Vorschlag zurück, auch bei unklarem Material.`

const SYSTEM_PROMPT = `Du bist ein hilfreicher Lernassistent für Schülerinnen und Schüler ab der 5. Klasse.
Deine Aufgabe ist es, aus dem gegebenen Lernmaterial präzise Lernkarten (Flashcards) zu erstellen.

Regeln:
- Erstelle zwischen 8 und 20 Karteikarten, je nach Umfang des Materials.
- Jede Karte hat eine klare FRAGE (Vorderseite) und eine knackige ANTWORT (Rückseite).
- WICHTIG: Erstelle KEINE Meta-Fragen zum Dokument selbst (vermeide z.B. "Was ist das Thema des Textes?").
- WICHTIG: Jede Frage muss aus sich heraus verständlich formuliert sein und ausreichend fachlichen Kontext bieten, sodass sie auch losgelöst vom Material als Vokabel abgefragt werden kann. (FALSCH: "Was passiert im dritten Schritt?" RICHTIG: "Was passiert im dritten Schritt der Fotosynthese?")
- Stelle Fragen zu spezifischen Begriffen, Fakten, Regeln oder Zusammenhängen. Es ist kein Ratespiel, sondern echtes Abfragen von Fachwissen.
- Formuliere alles auf Deutsch, kindgerecht und verständlich.
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

function getQuizPrompt(subject?: string, topic?: string): string {
    const langSubjects = ['Englisch', 'Deutsch', 'Französisch', 'Spanisch', 'Latein', 'Italienisch', 'Sprachaufenthalt']
    const isLanguage = subject && langSubjects.some(s => subject.toLowerCase().includes(s.toLowerCase()))

    let subjectSpecificInstructions = ''
    if (isLanguage) {
        subjectSpecificInstructions = `
- Da es sich um das Fach "${subject}" handelt, fokussiere dich auf:
    1. Grammatik und korrekten Satzbau (z.B. richtige Wortstellung).
    2. Korrekte Übersetzung zwischen Deutsch und ${subject}.
    3. Korrekte Anwendung und Bedeutung von Vokabeln im Kontext.
- WICHTIG: Vermeide reine "Faktenfragen" zum Inhalt von Tabellen oder Bildern (z.B. "Was macht Person X laut Tabelle?"), wenn diese ohne das Bild nicht sinnvoll sind. Die Fragen sollen das Sprachverständnis und die Sprachregeln prüfen.`
    } else {
        const subjectStr = subject || 'das vorliegende Fach'
        subjectSpecificInstructions = `
- Da es sich um das Fach "${subjectStr}" handelt, fokussiere dich auf:
    1. Das Verständnis und die Anwendung des Lernstoffs.
    2. Grundlegende Konzepte, Regeln und Zusammenhänge.
- WICHTIG: Vermeide Fragen, die sich zu stark auf die äußere Form oder spezifische Positionen im Dokument beziehen (z.B. "Was steht in der 3. Zeile?"). Der Fokus liegt auf dem inhaltlichen Wissen.`
    }

    if (topic) {
        subjectSpecificInstructions += `\n- Das konkrete Thema ist: "${topic}".`
    }

    return `Du bist ein Lehrer, der einen Wissenstest erstellt.
Erstelle 8 bis 12 Multiple-Choice-Fragen auf Deutsch für Schülerinnen und Schüler ab der 5. Klasse.
${subjectSpecificInstructions}

Jede Frage hat:
- eine klare Frage. WICHTIG: Die Frage muss aus sich heraus verständlich sein und genügend fachlichen Kontext bieten (z.B. statt "Was passiert im 3. Schritt?" explizit "Was passiert im 3. Schritt der Fotosynthese?"). Stelle keine Meta-Fragen zum Text ("Worum geht es in dem Material?"). WICHTIG: Vermeide Formulierungen wie "laut Seite 1", "im Text steht" oder "auf dem Bild sieht man". Die Fragen müssen aussehen, als kämen sie aus einem allgemeinen Lehrbuch.
- exakt 4 Antwortoptionen (A bis D), davon genau eine richtig
- den Index der richtigen Antwort (0 = erste Option)
- eine kurze, kindgerechte Erklärung warum die Antwort richtig ist (1 Satz)

Antworte NUR mit einem validen JSON-Array, ohne Erklärungen davor oder danach:
[{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}]`
}

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
    title: string,
    subject?: string,
    topic?: string
): Promise<QuizQuestion[]> {
    const client = getClient()
    const base64Data = fileBuffer.toString('base64')
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: getQuizPrompt(subject, topic) },
                { text: `\n\nDokumenttitel: "${title}"` },
                { inlineData: { mimeType, data: base64Data } },
            ],
        }],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseQuizQuestions(raw)
}

// ─── Fach- & Thema-Erkennung ─────────────────────────────────────────────────

function parseSubjectDetection(rawText: string): SubjectDetection {
    const match = rawText.match(/\{[\s\S]*?\}/)
    if (!match) return { subject: 'Sonstiges', topic: 'Allgemein', context_info: '', confidence: 'low' }
    try {
        const parsed = JSON.parse(match[0])
        return {
            subject: String(parsed.subject ?? 'Sonstiges').trim(),
            topic: String(parsed.topic ?? 'Allgemein').trim(),
            context_info: String(parsed.context_info ?? '').trim(),
            confidence: parsed.confidence === 'high' ? 'high' : 'low',
        }
    } catch {
        return { subject: 'Sonstiges', topic: 'Allgemein', context_info: '', confidence: 'low' }
    }
}

export async function detectSubjectAndTopicFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    title: string
): Promise<SubjectDetection> {
    const client = getClient()
    const base64Data = fileBuffer.toString('base64')
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user', parts: [
                { text: SUBJECT_DETECTION_PROMPT },
                { text: `\n\nDateititel: "${title}"` },
                { inlineData: { mimeType, data: base64Data } },
            ]
        }],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseSubjectDetection(raw)
}

export async function detectSubjectAndTopicFromText(
    text: string,
    title: string
): Promise<SubjectDetection> {
    const client = getClient()
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user', parts: [
                { text: SUBJECT_DETECTION_PROMPT },
                { text: `\n\nDateititel: "${title}"\n\nInhalt:\n${text.slice(0, 20000)}` },
            ]
        }],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseSubjectDetection(raw)
}
export async function generateQuizQuestionsFromText(
    text: string,
    title: string,
    subject?: string,
    topic?: string
): Promise<QuizQuestion[]> {
    const client = getClient()
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: getQuizPrompt(subject, topic) },
                { text: `\n\nDokumenttitel: "${title}"\n\nInhalt:\n${text.slice(0, 50000)}` },
            ],
        }],
    })
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseQuizQuestions(raw)
}

// ─── Text-to-Speech (Gemini 2.0 TTS) ─────────────────────────────────────────

/**
 * Konvertiert PCM-L16-Audio (wie von Gemini TTS zurückgegeben) in einen WAV-Buffer.
 */
export function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
    const numChannels = 1
    const bitsPerSample = 16
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
    const blockAlign = numChannels * (bitsPerSample / 8)
    const dataSize = pcm.length
    const header = Buffer.alloc(44)

    header.write('RIFF', 0)
    header.writeUInt32LE(dataSize + 36, 4)
    header.write('WAVE', 8)
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16)
    header.writeUInt16LE(1, 20)
    header.writeUInt16LE(numChannels, 22)
    header.writeUInt32LE(sampleRate, 24)
    header.writeUInt32LE(byteRate, 28)
    header.writeUInt16LE(blockAlign, 32)
    header.writeUInt16LE(bitsPerSample, 34)
    header.write('data', 36)
    header.writeUInt32LE(dataSize, 40)

    return Buffer.concat([header, pcm])
}

/**
 * Erzeugt eine WAV-Audiodatei aus einem Podcast-Script via Gemini 2.0 Flash TTS.
 */
export async function scriptToAudioBuffer(script: string): Promise<Buffer> {
    const client = getClient()

    // Kürze sehr lange Scripts (Gemini TTS-Limit)
    const MAX_CHARS = 8000
    const text = script.length > MAX_CHARS
        ? script.slice(0, MAX_CHARS) + ' [Ende des Podcasts]'
        : script

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client.models as any).generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ parts: [{ text }] }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    })

    const part = response.candidates?.[0]?.content?.parts?.[0]
    if (!part?.inlineData?.data) {
        throw new Error('Gemini TTS hat kein Audio zurückgegeben.')
    }

    const pcmBuffer = Buffer.from(part.inlineData.data, 'base64')
    const mimeType: string = part.inlineData.mimeType ?? ''
    const rateMatch = mimeType.match(/rate=(\d+)/)
    const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000

    return pcmToWav(pcmBuffer, sampleRate)
}

// ─── Multi-Bild Gruppierung (BLAST Phase 2) ────────────────────────────────

const GROUPING_PROMPT = `Du bist ein intelligenter Lernassistent. Erstelle aus den beiliegenden Bildern (Buchseiten, Arbeitsblätter) sinnvolle Lerngruppen.
Bilder, die thematisch eng zusammenhängen (z.B. 3 Seiten zum Thema "Photosynthese"), sollen zu EINER Gruppe zusammengefasst werden.
Bilder, die ganz andere Themen behandeln, bekommen eigene Gruppen.

Für jede Gruppe brauchst du:
- title: Einen kurzen, motivierenden Titel (z.B. "Alles über die Photosynthese 🌿")
- subject: Das Schulfach (z.B. "Biologie")
- topic: Das konkrete Thema (z.B. "Pflanzen")
- imageIndices: Ein Array mit den Indizes der Bilder (0-basiert, wie hochgeladen), die zu dieser Gruppe gehören. Jedes Bild MUSS genau *einer* Gruppe zugeordnet werden.
- reasoning: Ganz kurzer Grund (1 Satz, max. 10 Wörter), warum diese Bilder zusammenpassen.

Antworte NUR mit einem validen JSON-Array. Beispiel:
[
  {
    "id": "group_1",
    "title": "Photosynthese basics",
    "subject": "Biologie",
    "topic": "Pflanzen",
    "imageIndices": [0, 1],
    "reasoning": "Beide Seiten erklären die Photosynthese."
  }
]`;

/**
 * Nimmt ein Array von Bild-Buffern und lässt Gemini logische Gruppen bilden.
 */
export async function groupImagesByContext(
    images: { buffer: Buffer; mimeType: string; title: string }[]
): Promise<ImageGroup[]> {
    if (!images.length) return [];

    const client = getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: GROUPING_PROMPT }];

    images.forEach((img, i) => {
        parts.push({ text: `\nBild Index ${i} - Dateiname: "${img.title}"` });
        parts.push({
            inlineData: {
                mimeType: img.mimeType,
                data: img.buffer.toString('base64')
            }
        });
    });

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }]
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Kein JSON in der Antwort zur Gruppierung gefunden.');

    const groups: ImageGroup[] = JSON.parse(match[0]);

    // IDs sicherstellen
    return groups.map((g, i) => ({
        ...g,
        id: g.id || `group_${Date.now()}_${i}`
    }));
}

// ─── COLLECTION-Unterstützung (Mehrere Bilder) ────────────────────────────────

export async function generateFlashcardsFromCollection(
    files: { buffer: Buffer; mimeType: string; title: string }[],
    collectionTitle: string
): Promise<Flashcard[]> {
    const client = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [
        { text: SYSTEM_PROMPT },
        { text: `\n\nSammlungstitel: "${collectionTitle}"\n\nBitte erstelle umfassende Karteikarten aus der folgenden Sammlung zusammengehöriger Bilder:` }
    ];
    files.forEach((f, i) => {
        parts.push({ text: `\nSeite ${i + 1} (${f.title}):` });
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.buffer.toString('base64') } });
    });

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }]
    });
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return parseFlashcards(raw);
}

export async function generatePodcastScriptFromCollection(
    files: { buffer: Buffer; mimeType: string; title: string }[],
    collectionTitle: string
): Promise<string> {
    const client = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [
        { text: PODCAST_PROMPT },
        { text: `\n\nSammlungstitel: "${collectionTitle}"` }
    ];
    files.forEach((f, i) => {
        parts.push({ text: `\nSeite ${i + 1} (${f.title}):` });
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.buffer.toString('base64') } });
    });

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }]
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

export async function generateQuizQuestionsFromCollection(
    files: { buffer: Buffer; mimeType: string; title: string }[],
    collectionTitle: string,
    subject?: string,
    topic?: string
): Promise<QuizQuestion[]> {
    const client = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [
        { text: getQuizPrompt(subject, topic) },
        { text: `\n\nSammlungstitel: "${collectionTitle}"` }
    ];
    files.forEach((f, i) => {
        parts.push({ text: `\nSeite ${i + 1} (${f.title}):` });
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.buffer.toString('base64') } });
    });

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }]
    });
    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return parseQuizQuestions(raw);
}

