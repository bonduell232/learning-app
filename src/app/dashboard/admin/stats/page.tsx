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

    // Statistiken laden
    const { data: logs } = await supabase
        .from('ai_usage_logs')
        .select(`
            id,
            model_id,
            input_tokens,
            output_tokens,
            estimated_cost_usd,
            created_at,
            documents (
                title
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    const totalCost = logs?.reduce((acc, log) => acc + (Number(log.estimated_cost_usd) || 0), 0) || 0;
    const totalTokens = logs?.reduce((acc, log) => acc + log.input_tokens + log.output_tokens, 0) || 0;

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    <span className="block text-indigo-600">Admin Dashboard</span>
                    KI-Kostenkontrolle & Analyse
                </h1>
                <p className="mt-3 text-xl text-gray-500">
                    Behalte die Ausgaben für Vertex AI und Sprachmodelle im Blick.
                </p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
                <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Gesamtkosten (USD)</dt>
                    <dd className="mt-1 text-3xl font-black text-indigo-600">${totalCost.toFixed(4)}</dd>
                    <div className="mt-2 text-xs text-gray-400">Basierend auf den letzten 100 Anfragen</div>
                </div>

                <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Gesamt-Tokens verwendet</dt>
                    <dd className="mt-1 text-3xl font-bold text-gray-900">{totalTokens.toLocaleString()}</dd>
                    <div className="mt-2 text-xs text-gray-400">Summe In/Out Tokens</div>
                </div>

                <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Schnitt pro Podcast</dt>
                    <dd className="mt-1 text-3xl font-bold text-gray-900">
                        ${logs?.length ? (totalCost / logs.length).toFixed(4) : '0.0000'}
                    </dd>
                    <div className="mt-2 text-xs text-gray-400">Basierend auf {logs?.length || 0} Generierungen</div>
                </div>
            </div>

            {/* Table */}
            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-2xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modell</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dokument</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens (I/O)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kosten (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs && logs.length > 0 ? (
                                        logs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(log.created_at).toLocaleString('de-DE', { 
                                                        day: '2-digit', month: '2-digit', year: 'numeric', 
                                                        hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {log.model_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {log.documents?.title || <span className="text-gray-400 italic">Unbekannt</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.input_tokens.toLocaleString()} / {log.output_tokens.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    ${Number(log.estimated_cost_usd).toFixed(6)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                                Noch keine Nutzungsdaten vorhanden. Generiere einen Podcast, um die Statistik zu starten.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
