import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { generatePodcastScript } from '@/services/vertexService';

export async function POST(request: Request) {
    try {
        const { prompt, documentId } = await request.json();

        if (!prompt || !documentId) {
            return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
        }

        const result = await generatePodcastScript(prompt, documentId);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Vertex API Route Fehler:', error);
        return NextResponse.json({ error: error.message || 'Interner Serverfehler' }, { status: 500 });
    }
}
