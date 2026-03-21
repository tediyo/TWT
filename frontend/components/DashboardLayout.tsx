"use client";

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, token, isGuest, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-amber-500 dark:text-amber-400">QA Locator Tool</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {isGuest ? 'Welcome, Guest' : `Welcome back, ${user?.email}`}
                    </p>
                </div>
                
                {/* Navigation Pills */}
                <nav className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                    <Link 
                        href="/dashboard" 
                        className={`text-sm px-4 py-1.5 rounded-md transition-all font-medium ${
                            pathname === '/dashboard' 
                                ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm' 
                                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        Overview
                    </Link>
                    <Link 
                        href="/dashboard/locator" 
                        className={`text-sm px-4 py-1.5 rounded-md transition-all font-medium ${
                            pathname === '/dashboard/locator' 
                                ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm' 
                                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        Locator
                    </Link>
                </nav>

                <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
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
                    {!isGuest && token && (
                        <Link href="/history" className="text-sm border border-[var(--card-border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all font-medium hover:-translate-y-0.5 shadow-sm whitespace-nowrap">
                            <span className="text-lg leading-none">🕒</span> History
                        </Link>
                    )}
                    <button onClick={logout} className="text-sm hover:text-red-400 transition-colors whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            {isGuest && (
                <div className="flex items-center justify-between p-4 rounded-xl border font-medium" style={{ background: 'var(--badge-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--tag-text)' }}>
                        <span className="mr-2">👤</span> You&apos;re using guest mode. <span className="opacity-80">Sign up to save your search history.</span>
                    </p>
                    <a href="/signup" className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap ml-4">
                        Sign Up →
                    </a>
                </div>
            )}

            {/* Page Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
