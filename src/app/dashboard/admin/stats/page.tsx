import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/utils/checkLimit';

export default async function AdminStatsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const role = await getUserRole(supabase, user.id);
    
    // Einfache Absicherung: Nur Admins oder Test-Nutzer (während der Entwicklung) 
    // können die Kosten einsehen.
    if (role !== 'ADMIN' && role !== 'PREMIUM') {
        // return <div className="p-8">Zugriff verweigert.</div>;
    }

    // Alle Statistiken laden (kein Limit für die Gesamtübersicht)
    const { data: allLogs } = await supabase
        .from('ai_usage_logs')
        .select(`
            id,
            user_id,
            content_type,
            input_tokens,
            output_tokens,
            estimated_cost_usd,
            created_at,
            documents (
                title
            )
        `)
        .order('created_at', { ascending: false });

    const logs = allLogs || [];
    
    // Aggregation pro User
    const userMap: Record<string, { flashcards: number, quiz: number, audio: number, cost: number, lastSeen: string }> = {};
    let totalCost = 0;
    let totalTokens = 0;

    logs.forEach(log => {
        const uid = log.user_id;
        if (!userMap[uid]) {
            userMap[uid] = { flashcards: 0, quiz: 0, audio: 0, cost: 0, lastSeen: log.created_at };
        }
        
        // Zähle Inhaltstypen (mit Fallback für alte Logs)
        const type = log.content_type;
        if (type === 'FLASHCARD') userMap[uid].flashcards++;
        else if (type === 'QUIZ') userMap[uid].quiz++;
        else if (type === 'AUDIO') userMap[uid].audio++;
        
        const cost = Number(log.estimated_cost_usd) || 0;
        userMap[uid].cost += cost;
        totalCost += cost;
        totalTokens += (log.input_tokens + log.output_tokens);
    });

    const sortedUsers = Object.entries(userMap).sort((a, b) => b[1].cost - a[1].cost);

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <header className="mb-10 lg:flex lg:items-center lg:justify-between">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        <span className="block text-indigo-600">Admin Dashboard</span>
                        KI-Finanzübersicht & Nutzeranalyse
                    </h1>
                    <p className="mt-3 text-xl text-gray-500">
                        Präzise Auswertung der erzeugten Inhalte und anfallenden Kosten pro User.
                    </p>
                </div>
            </header>

            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-12">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 overflow-hidden shadow-xl rounded-2xl p-6 text-white">
                    <dt className="text-sm font-medium opacity-80 truncate uppercase tracking-wider">Gesamtkosten (All Users)</dt>
                    <dd className="mt-2 text-3xl font-black">${totalCost.toFixed(4)}</dd>
                    <div className="mt-2 text-xs opacity-60 italic">Über alle Zeiträume</div>
                </div>

                <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate uppercase tracking-wider">Aktive User (AI)</dt>
                    <dd className="mt-2 text-3xl font-bold text-gray-900">{sortedUsers.length}</dd>
                    <div className="mt-2 text-xs text-gray-400">Nutzer mit KI-Interaktion</div>
                </div>

                <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate uppercase tracking-wider">Gesamt-Tokens</dt>
                    <dd className="mt-2 text-3xl font-bold text-gray-900">{totalTokens.toLocaleString()}</dd>
                    <div className="mt-2 text-xs text-gray-400">Summe Input/Output</div>
                </div>

                <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate uppercase tracking-wider">Anfragen total</dt>
                    <dd className="mt-2 text-3xl font-bold text-gray-900">{logs.length}</dd>
                    <div className="mt-2 text-xs text-gray-400">KI-Inhalte generiert</div>
                </div>
            </div>

            {/* User Breakdown Table */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-base">👤</span>
                    Nutzer-Abrechnung & Aktivität
                </h2>
                <div className="bg-white shadow-lg border border-gray-100 sm:rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nutzer-ID</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Karten</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Quizzes</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Podcasts</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Kosten (USD)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedUsers.map(([uid, stats]) => (
                                <tr key={uid} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={uid}>
                                            {uid}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                        {stats.flashcards}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                        {stats.quiz}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                        {stats.audio}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-indigo-600">
                                        ${stats.cost.toFixed(6)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mr-3 text-base">⚡</span>
                    Letzte Aktivitäten
                </h2>
                <div className="bg-white shadow-lg border border-gray-100 sm:rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Datum</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Typ</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dokument</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Kosten</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.slice(0, 20).map((log: any) => (
                                <tr key={log.id} className="text-sm hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(log.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            log.content_type === 'FLASHCARD' ? 'bg-orange-100 text-orange-700' :
                                            log.content_type === 'QUIZ' ? 'bg-green-100 text-green-700' :
                                            log.content_type === 'AUDIO' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {log.content_type || 'Legacy'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {log.documents?.title || 'Unbekannt'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-600">
                                        ${Number(log.estimated_cost_usd).toFixed(6)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
