"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface LocatorResult {
    tag: string;
    locator: string;
}

interface AuthWarning {
    warning: string;
    redirectedTo: string;
    hint: string;
    loginError?: string;
    results: [];
}

export default function DashboardPage() {
    const { user, token, logout, isLoading } = useAuth();
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [keyword, setKeyword] = useState('');
    const [locatorType, setLocatorType] = useState('xpath');
    const [cookies, setCookies] = useState('');
    const [authToken, setAuthToken] = useState('');
    const [siteUsername, setSiteUsername] = useState('');
    const [sitePassword, setSitePassword] = useState('');
    const [showAuth, setShowAuth] = useState(false);
    const [results, setResults] = useState<LocatorResult[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [authWarning, setAuthWarning] = useState<AuthWarning | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError('');
        setResults([]);
        setAuthWarning(null);

        try {
            const res = await fetch('http://localhost:3001/locator/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    url, keyword, locatorType,
                    cookies: cookies || undefined,
                    authToken: authToken || undefined,
                    siteUsername: siteUsername || undefined,
                    sitePassword: sitePassword || undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                // Check if the response is an auth warning
                if (data.warning) {
                    setAuthWarning(data);
                    setShowAuth(true); // Auto-show auth fields
                } else if (Array.isArray(data)) {
                    setResults(data);
                } else {
                    setResults([]);
                }
            } else {
                setError(data.message || 'Generation failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const isMultiLine = locatorType === 'styles' || locatorType === 'outerhtml' || locatorType === 'element';

    if (isLoading || !user) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-400">QA Locator Tool</h1>
                    <p className="text-slate-400 text-sm">Welcome back, {user.email}</p>
                </div>
                <button onClick={logout} className="text-sm text-slate-500 hover:text-red-400 transition-colors">
                    Sign Out
                </button>
            </header>

            <section className="glass p-6 md:p-8 shadow-xl">
                <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Target URL</label>
                        <input
                            type="url"
                            required
                            placeholder="https://example.com"
                            className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Keyword</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Email"
                            className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Copy As</label>
                        <select
                            className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                            value={locatorType}
                            onChange={(e) => setLocatorType(e.target.value)}
                        >
                            <option value="xpath">XPath</option>
                            <option value="full_xpath">Full XPath</option>
                            <option value="selector">Selector</option>
                            <option value="js_path">JS Path</option>
                            <option value="outerhtml">OuterHTML</option>
                            <option value="element">Element</option>
                            <option value="styles">Styles</option>
                        </select>
                    </div>

                    {/* Auth toggle and inputs */}
                    <div className="md:col-span-4">
                        <button
                            type="button"
                            onClick={() => setShowAuth(!showAuth)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                            <span>{showAuth ? '▼' : '▶'}</span>
                            🔒 Authentication (for login-protected pages)
                        </button>
                        {showAuth && (
                            <div className="mt-3 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Site Username / Email</label>
                                        <input
                                            type="text"
                                            placeholder="your@email.com"
                                            className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                                            value={siteUsername}
                                            onChange={(e) => setSiteUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Site Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                                            value={sitePassword}
                                            onChange={(e) => setSitePassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600">
                                    The tool will auto-fill and submit the login form if the site requires authentication.
                                </p>

                                <div className="border-t border-slate-700/50 pt-4 mt-2">
                                    <p className="text-xs text-slate-500 mb-3">Advanced: use cookies or auth tokens instead</p>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Cookies</label>
                                            <textarea
                                                placeholder="Paste cookies from browser: F12 → Console → document.cookie"
                                                className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-mono h-16 resize-y"
                                                value={cookies}
                                                onChange={(e) => setCookies(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Authorization Token</label>
                                            <textarea
                                                placeholder="Bearer eyJhbGciOiJIUzI1NiIs..."
                                                className="block w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-mono h-16 resize-y"
                                                value={authToken}
                                                onChange={(e) => setAuthToken(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-4 mt-4">
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full btn-primary text-white font-bold py-3 rounded-xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Scanning Page...
                                </>
                            ) : 'Generate Locators'}
                        </button>
                    </div>
                </form>
            </section>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center justify-center">
                    {error}
                </div>
            )}

            {authWarning && (
                <div className={`p-5 rounded-lg space-y-3 ${
                    authWarning.loginError
                        ? 'bg-red-500/10 border border-red-500/50'
                        : 'bg-amber-500/10 border border-amber-500/50'
                }`}>
                    <div className={`flex items-center gap-2 font-semibold ${
                        authWarning.loginError ? 'text-red-300' : 'text-amber-300'
                    }`}>
                        <span className="text-lg">{authWarning.loginError ? '❌' : '🔒'}</span>
                        {authWarning.warning}
                    </div>
                    {authWarning.loginError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-sm text-red-300 font-medium">Site Error Message:</p>
                            <p className="text-sm text-red-200 mt-1">{authWarning.loginError}</p>
                        </div>
                    )}
                    <p className="text-sm text-slate-400">
                        Redirected to: <code className="bg-slate-800/50 px-2 py-0.5 rounded text-xs">{authWarning.redirectedTo}</code>
                    </p>
                    {!authWarning.loginError && (
                        <p className="text-sm text-amber-400/80">{authWarning.hint}</p>
                    )}
                </div>
            )}

            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Results
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full uppercase tracking-wider">
                        {results.length} Matches
                    </span>
                </h2>

                {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {results.map((res, idx) => (
                            <div key={idx} className="glass p-4 flex flex-col gap-3 group transition-all hover:bg-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-indigo-300 font-mono">
                                        {res.tag}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(res.locator, idx)}
                                        className="bg-slate-700/50 hover:bg-indigo-500 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
                                    >
                                        {copiedIdx === idx ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                                {isMultiLine ? (
                                    <pre className="text-slate-300 text-sm font-mono bg-slate-900/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                                        {res.locator}
                                    </pre>
                                ) : (
                                    <code className="text-slate-300 break-all text-sm font-mono">
                                        {res.locator}
                                    </code>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    !isGenerating && !error && !authWarning && (
                        <div className="glass p-12 text-center text-slate-500 border-dashed border-2">
                            Enter a URL and keyword above to start scan
                        </div>
                    )
                )}
            </section>
        </div>
    );
}
