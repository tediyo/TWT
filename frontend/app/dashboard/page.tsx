"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

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

export default function DashboardPageWrapper() {
    return (
        <Suspense fallback={<div className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading application...</div>}>
            <DashboardPage />
        </Suspense>
    );
}

function DashboardPage() {
    const { user, token, isGuest, logout, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isLoading && !user && !isGuest) {
            router.push('/login');
        }
    }, [user, isGuest, isLoading, router]);

    // Parse URL parameters for "Re-run" functionality from history
    useEffect(() => {
        const rerunUrl = searchParams.get('url');
        const rerunKeyword = searchParams.get('keyword');
        const rerunType = searchParams.get('type');
        
        if (rerunUrl) setUrl(rerunUrl);
        if (rerunKeyword) setKeyword(rerunKeyword);
        if (rerunType) setLocatorType(rerunType);
    }, [searchParams]);



    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError('');
        setResults([]);
        setAuthWarning(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/locator/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
                if (data.warning) {
                    setAuthWarning(data);
                    setShowAuth(true);
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

    if (isLoading || (!user && !isGuest)) return <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading...</div>;

    const inputStyle = {
        background: 'var(--input-bg)',
        borderColor: 'var(--input-border)',
        color: 'var(--foreground)',
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-amber-500 dark:text-amber-400">QA Locator Tool</h1>
                        {!isGuest && token && (
                            <Link href="/history" className="text-sm bg-transparent border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 px-3 py-1 rounded-lg flex items-center gap-2 transition-colors font-medium">
                                <span className="text-lg leading-none">🕒</span> History
                            </Link>
                        )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {isGuest ? 'Welcome, Guest' : `Welcome back, ${user?.email}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"/>
                                <line x1="12" y1="1" x2="12" y2="3"/>
                                <line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/>
                                <line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                        )}
                    </button>
                    <button onClick={logout} className="text-sm hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            {isGuest && (
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--badge-bg)', border: '1px solid var(--glass-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--muted-strong)' }}>
                        👤 You&apos;re using guest mode. <span style={{ color: 'var(--muted)' }}>Sign up to save your search history.</span>
                    </p>
                    <a href="/signup" className="text-sm font-semibold text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300 transition-colors whitespace-nowrap ml-4">
                        Sign Up →
                    </a>
                </div>
            )}

            <section className="glass p-6 md:p-8 shadow-xl">
                <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Target URL</label>
                        <input
                            type="url"
                            required
                            placeholder="https://example.com"
                            className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                            style={inputStyle}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Keyword</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Email"
                            className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                            style={inputStyle}
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Copy As</label>
                        <select
                            className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none appearance-none"
                            style={inputStyle}
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
                            className="text-xs text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
                        >
                            <span>{showAuth ? '▼' : '▶'}</span>
                            🔒 Authentication (for login-protected pages)
                        </button>
                        {showAuth && (
                            <div className="mt-3 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Site Username / Email</label>
                                        <input
                                            type="text"
                                            placeholder="your@email.com"
                                            className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
                                            style={inputStyle}
                                            value={siteUsername}
                                            onChange={(e) => setSiteUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Site Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
                                            style={inputStyle}
                                            value={sitePassword}
                                            onChange={(e) => setSitePassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                    The tool will auto-fill and submit the login form if the site requires authentication.
                                </p>

                                <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
                                    <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Advanced: use cookies or auth tokens instead</p>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Cookies</label>
                                            <textarea
                                                placeholder="Paste cookies from browser: F12 → Console → document.cookie"
                                                className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm font-mono h-16 resize-y"
                                                style={inputStyle}
                                                value={cookies}
                                                onChange={(e) => setCookies(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Authorization Token</label>
                                            <textarea
                                                placeholder="Bearer eyJhbGciOiJIUzI1NiIs..."
                                                className="block w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm font-mono h-16 resize-y"
                                                style={inputStyle}
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
                            className="w-full btn-primary font-bold py-3 rounded-xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    Scanning Page...
                                </>
                            ) : 'Generate Locators'}
                        </button>
                    </div>
                </form>
            </section>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 dark:text-red-400 p-4 rounded-lg flex items-center justify-center">
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
                        authWarning.loginError ? 'text-red-400 dark:text-red-300' : 'text-amber-500 dark:text-amber-300'
                    }`}>
                        <span className="text-lg">{authWarning.loginError ? '❌' : '🔒'}</span>
                        {authWarning.warning}
                    </div>
                    {authWarning.loginError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-sm text-red-500 dark:text-red-300 font-medium">Site Error Message:</p>
                            <p className="text-sm text-red-400 dark:text-red-200 mt-1">{authWarning.loginError}</p>
                        </div>
                    )}
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Redirected to: <code style={{ background: 'var(--code-bg)', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>{authWarning.redirectedTo}</code>
                    </p>
                    {!authWarning.loginError && (
                        <p className="text-sm text-amber-600 dark:text-amber-400/80">{authWarning.hint}</p>
                    )}
                </div>
            )}

            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Results
                    <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
                        {results.length} Matches
                    </span>
                </h2>

                {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {results.map((res, idx) => (
                            <div key={idx} className="glass p-4 flex flex-col gap-3 group transition-all" style={{ ['--tw-glass-hover' as string]: 'var(--surface-hover)' }}>
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}>
                                        {res.tag}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(res.locator, idx)}
                                        className="px-4 py-2 rounded-lg text-sm transition-all"
                                        style={{
                                            background: copiedIdx === idx ? 'var(--copy-btn-hover-bg)' : 'var(--copy-btn-bg)',
                                            color: copiedIdx === idx ? 'var(--copy-btn-hover-text)' : 'var(--copy-btn-text)',
                                        }}
                                        onMouseEnter={(e) => { if (copiedIdx !== idx) { e.currentTarget.style.background = 'var(--copy-btn-hover-bg)'; e.currentTarget.style.color = 'var(--copy-btn-hover-text)'; } }}
                                        onMouseLeave={(e) => { if (copiedIdx !== idx) { e.currentTarget.style.background = 'var(--copy-btn-bg)'; e.currentTarget.style.color = 'var(--copy-btn-text)'; } }}
                                    >
                                        {copiedIdx === idx ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                                {isMultiLine ? (
                                    <pre className="text-sm font-mono p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto"
                                        style={{ background: 'var(--code-bg)', color: 'var(--muted-strong)' }}>
                                        {res.locator}
                                    </pre>
                                ) : (
                                    <code className="break-all text-sm font-mono" style={{ color: 'var(--muted-strong)' }}>
                                        {res.locator}
                                    </code>
                                )}
                            </div>
                        ))}
                    </div>
                ) : null}
            </section>


        </div>
    );
}
