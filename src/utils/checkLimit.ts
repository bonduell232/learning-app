import type { SupabaseClient } from '@supabase/supabase-js'
import { getLimit, type Role } from '@/config/features'
import type { FeatureKey } from '@/config/features'

// Re-export for convenience
export type { Role }

/** Tabellen-Map für die Limit-Prüfung */
const TABLE_MAP: Record<string, { table: string; userCol: string }> = {
    upload: { table: 'documents', userCol: 'user_id' },
    flashcards: { table: 'flashcard_decks', userCol: 'user_id' },
    audio: { table: 'audio_summaries', userCol: 'user_id' },
    quiz: { table: 'quizzes', userCol: 'user_id' },
}

const LIMIT_KEY_MAP: Record<string, string> = {
    upload: 'maxFiles',
    flashcards: 'maxDecks',
    audio: 'maxSummaries',
    quiz: 'maxQuizzes',
}

export interface LimitCheck {
    allowed: boolean
    current: number
    max: number
}

/**
 * Prüft ob ein User sein Feature-Limit erreicht hat.
 * @param supabase - Supabase-Client (mit User-Session)
 * @param userId   - UUID des Users
 * @param role     - 'FREE' | 'PREMIUM'
 * @param feature  - Feature-Schlüssel aus features.ts
 */
export async function checkLimit(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    role: Role,
    feature: FeatureKey
): Promise<LimitCheck> {
    const max = getLimit(feature, LIMIT_KEY_MAP[feature], role)

    // PREMIUM hat unbegrenzt → sofort erlauben
    if (max === Infinity) return { allowed: true, current: 0, max: Infinity }

    const { table, userCol } = TABLE_MAP[feature]
    const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq(userCol, userId)

    const current = count ?? 0
    return { allowed: current < max, current, max }
}

/** Holt die Rolle des eingeloggten Users aus der profiles-Tabelle */
export async function getUserRole(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string
): Promise<Role> {
    const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
    return (data?.role as Role) ?? 'FREE'
}
