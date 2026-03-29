import { createClient } from '@/utils/supabase/server';
import { getAI, MODEL_NAME, calculateEstimatedCost } from '@/utils/vertex';

export interface PodcastGenerationResponse {
    script: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
    };
}

export async function generatePodcastScript(prompt: string, documentId: string): Promise<PodcastGenerationResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Nicht authentifiziert');

    // MIGRATION: Neues modernes SDK (ohne verschachtelte Content-Strukturen)
    const result = await getAI().models.generateContent({
        model: MODEL_NAME,
        contents: `${prompt}\n\nGanz wichtig: Falls der Text Sprach- oder Sonderzeichen enthält, wandle sie in gut lesbares Deutsch um.`,
        config: {
            maxOutputTokens: 2048,
            temperature: 0.7,
        }
    });

    const text = result.text || '';
    const usage = result.usageMetadata;

    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const estimatedCost = calculateEstimatedCost(MODEL_NAME, inputTokens, outputTokens);

    // Logging in die DB (Kostenkontrolle) - Jetzt sicher über RLS
    const { error: logErr } = await supabase
        .from('ai_usage_logs')
        .insert({
            user_id: user.id,
            document_id: documentId,
            model_id: MODEL_NAME,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost_usd: estimatedCost,
        });

    if (logErr) console.error("Kosten-Logging fehlgeschlagen:", logErr.message);

    return {
        script: text,
        usage: {
            inputTokens,
            outputTokens,
            estimatedCost,
        }
    };
}
