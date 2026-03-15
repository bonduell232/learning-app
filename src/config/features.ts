/**
 * Feature-Toggle-Konfiguration – EINZIGE Stelle für alle Limits & Flags.
 *
 * Um ein Feature für eine Rolle zu ändern, nur diese Datei bearbeiten.
 * Kein anderer Code muss angepasst werden.
 */

export type Role = 'FREE' | 'PREMIUM'

export const FEATURES = {
    upload: {
        /** Maximale Anzahl Dokumente */
        maxFiles: { FREE: 1, PREMIUM: Infinity },
    },
    flashcards: {
        /** Feature aktiv? */
        enabled: { FREE: true, PREMIUM: true },
        /** Maximale Anzahl Lernkarten-Decks */
        maxDecks: { FREE: 1, PREMIUM: Infinity },
    },
    audio: {
        enabled: { FREE: true, PREMIUM: true },
        /** Maximale Anzahl Audio-Zusammenfassungen */
        maxSummaries: { FREE: 1, PREMIUM: Infinity },
    },
    quiz: {
        enabled: { FREE: true, PREMIUM: true },
        /** Maximale Anzahl Quizze */
        maxQuizzes: { FREE: 1, PREMIUM: Infinity },
    },
} as const

export type FeatureKey = keyof typeof FEATURES

/** Gibt den numerischen Limit-Wert für eine Rolle zurück */
export function getLimit(feature: FeatureKey, key: string, role: Role): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (FEATURES[feature] as any)[key]?.[role]
    return typeof val === 'number' ? val : 0
}

/** Gibt zurück ob ein Feature für eine Rolle aktiv ist */
export function isEnabled(feature: FeatureKey, role: Role): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (FEATURES[feature] as any)?.enabled?.[role] === true
}
