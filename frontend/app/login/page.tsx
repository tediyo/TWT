"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginAsGuest } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.access_token, data.user);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        }
    };

    const handleGoogleLogin = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        window.location.href = `${apiUrl}/auth/google`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="card w-full max-w-md p-8 space-y-6">
                <h1 className="text-3xl font-bold text-center text-amber-500 dark:text-amber-400">
                    QA Locator Tool
                </h1>
                <p className="text-center" style={{ color: 'var(--muted)' }}>Login to your account</p>

                {error && <p className="bg-red-500/10 border border-red-500/50 text-red-500 dark:text-red-400 p-3 rounded-lg text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 p-2"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 p-2"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full btn-primary py-2.5 rounded-lg transition-all"
                    >
                        Sign In
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>OR</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
                </div>

                {/* Google Sign-In Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-sm"
                    style={{
                        background: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--foreground)',
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>

                {/* Guest Mode */}
                <button
                    onClick={loginAsGuest}
                    className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 cursor-pointer text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                        color: 'var(--muted)',
                        background: 'transparent',
                        border: '1px dashed var(--input-border)',
                    }}
                >
                    👤 Continue as Guest
                </button>

                <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                    Don&apos;t have an account? <Link href="/signup" className="text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
