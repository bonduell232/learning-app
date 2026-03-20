/**
 * Formatiert einen Datums-String in ein deutsches Format (z.B. "20. Mär 2026, 22:15")
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
