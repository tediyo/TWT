"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LocatorResult {
    tag: string;
    locator: string;
}

interface HistoryEntry {
    _id: string;
    url: string;
    keyword: string;
    locatorType: string;
    results: LocatorResult[];
    createdAt: string;
}

export default function HistoryPage() {
    const { user, token, isGuest, logout, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
    const [historyCopiedIdx, setHistoryCopiedIdx] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !user && !isGuest) {
            router.push('/login');
        }
    }, [user, isGuest, isLoading, router]);

    const fetchHistory = async () => {
        if (!token) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/locator/history`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch { }
    };

    useEffect(() => {
        if (token) fetchHistory();
    }, [token]);

    if (isLoading || (!user && !isGuest)) return <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading...</div>;

    if (isGuest) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="card w-full max-w-lg p-8 space-y-6 text-center">
                    <h1 className="text-3xl font-bold text-amber-500 mb-2">Search History</h1>
                    <p style={{ color: 'var(--muted)' }}>Guest users do not have access to search history.</p>
                    <Link href="/signup" className="block w-full btn-primary py-2.5 rounded-lg mt-4">Sign Up to Start Saving</Link>
                    <div className="mt-4">
                        <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">← Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex justify-between items-center bg-transparent mt-4 mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm px-3 py-1.5 rounded-md transition-all font-medium hover:-translate-y-0.5 shadow-sm" style={{ color: 'var(--foreground)', background: 'var(--surface)', border: '1px solid var(--card-border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Search History</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full font-medium shadow-sm">
                        {history.length} {history.length === 1 ? 'Search' : 'Searches'}
                    </span>
                    <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        )}
                    </button>
                    <button onClick={logout} className="text-sm hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>Sign Out</button>
                </div>
            </header>

            <section className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>View and re-run your past locators generation.</p>
                    {history.length > 0 && (
                        <button
                            onClick={async () => {
                                if (!confirm('Clear all search history?')) return;
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                                await fetch(`${apiUrl}/locator/history`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                });
                                setHistory([]);
                            }}
                            className="text-sm px-4 py-2 rounded-lg transition-all font-medium shadow-sm"
                            style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--card-border)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'var(--surface)'; }}
                        >
                            Clear All History
                        </button>
                    )}
                </div>

                {history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map((entry) => (
                            <div key={entry._id} className="card p-5">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <button
                                        onClick={() => setExpandedHistory(expandedHistory === entry._id ? null : entry._id)}
                                        className="flex-1 text-left bg-transparent border-none cursor-pointer p-0 focus:outline-none"
                                        style={{ color: 'var(--foreground)' }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>&quot;{entry.keyword}&quot;</span>
                                            <code className="text-xs px-2 py-0.5 rounded ml-2" style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}>{entry.locatorType}</code>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span style={{ color: 'var(--muted)' }}>on</span>
                                            <span className="font-mono truncate max-w-sm md:max-w-md" style={{ color: 'var(--muted-strong)' }}>{entry.url}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--foreground)' }}>
                                                <span>{expandedHistory === entry._id ? '▼' : '▶'}</span>
                                                {entry.results.length} results
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                                {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                     </button>
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-start self-end mt-2 md:mt-0">
                                        <button
                                            onClick={() => { 
                                                const rerunParams = new URLSearchParams({ url: entry.url, keyword: entry.keyword, type: entry.locatorType });
                                                router.push(`/dashboard/locator?${rerunParams.toString()}`);
                                            }}
                                            className="text-sm px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 shadow-sm"
                                            style={{ color: 'var(--foreground)', background: 'var(--surface)', border: '1px solid var(--card-border)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                                            title="Re-run this search in Dashboard"
                                        >
                                            <span className="text-lg leading-none">↻</span> Re-run
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                                                await fetch(`${apiUrl}/locator/history/${entry._id}`, {
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${token}` },
                                                });
                                                setHistory(h => h.filter(e => e._id !== entry._id));
                                            }}
                                            className="text-sm px-4 py-2 rounded-lg transition-all font-medium shadow-sm hover:bg-red-500/10"
                                            style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--card-border)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                                            title="Delete this entry"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {expandedHistory === entry._id && entry.results.length > 0 && (
                                    <div className="mt-5 space-y-3 pt-5 border-t border-[var(--card-border)]">
                                        {entry.results.map((res, idx) => {
                                            const copyKey = `${entry._id}-${idx}`;
                                            return (
                                                <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border border-transparent hover:border-amber-500/20 transition-colors" style={{ background: 'var(--code-bg)' }}>
                                                    <span className="text-xs px-2 py-1 rounded font-mono shrink-0" style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}>{res.tag}</span>
                                                    <code className="text-sm font-mono break-all flex-1 leading-relaxed" style={{ color: 'var(--muted-strong)' }}>{res.locator}</code>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(res.locator); setHistoryCopiedIdx(copyKey); setTimeout(() => setHistoryCopiedIdx(null), 2000); }}
                                                        className="text-xs px-3 py-1.5 rounded-md transition-all font-medium border border-[var(--card-border)]"
                                                        style={{
                                                            background: historyCopiedIdx === copyKey ? 'var(--copy-btn-hover-bg)' : 'var(--copy-btn-bg)',
                                                            color: historyCopiedIdx === copyKey ? 'var(--copy-btn-hover-text)' : 'var(--copy-btn-text)'
                                                        }}
                                                    >
                                                        {historyCopiedIdx === copyKey ? '✓ Copied' : 'Copy'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 card shadow-sm mt-8 border-dashed border-[var(--card-border)]">
                        <span className="text-4xl mb-4 block opacity-50">🕒</span>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>No history yet</h3>
                        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--muted)' }}>Generate some locators on the dashboard to see your history here.</p>
                        <Link href="/dashboard" className="inline-block mt-6 btn-primary px-6 py-2.5 rounded-lg shadow-sm">Go to Dashboard</Link>
                    </div>
                )}
            </section>
        </div>
    );
}
