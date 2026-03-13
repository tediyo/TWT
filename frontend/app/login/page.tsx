"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

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

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass w-full max-w-md p-8 space-y-6 shadow-2xl">
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    QA Locator Tool
                </h1>
                <p className="text-center" style={{ color: 'var(--muted)' }}>Login to your account</p>

                {error && <p className="bg-red-500/10 border border-red-500/50 text-red-500 dark:text-red-400 p-3 rounded text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
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
                            className="mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full btn-primary text-white font-bold py-2 rounded-md transition-all shadow-lg"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                    Don&apos;t have an account? <Link href="/signup" className="text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
