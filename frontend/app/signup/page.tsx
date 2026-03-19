"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, phoneNumber: phoneNumber || undefined, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Connection error');
        }
    };

    const handleGoogleSignup = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        window.location.href = `${apiUrl}/auth/google`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass w-full max-w-md p-8 space-y-6 shadow-2xl">
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                    Create Account
                </h1>
                <p className="text-center" style={{ color: 'var(--muted)' }}>Join the QA Locator Tool</p>

                {error && <p className="bg-red-500/10 border border-red-500/50 text-red-500 dark:text-red-400 p-3 rounded text-sm">{error}</p>}
                {success && <p className="bg-green-500/10 border border-green-500/50 text-green-500 dark:text-green-400 p-3 rounded text-sm">Account created! Redirecting to login...</p>}

                {!success && (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your full name"
                                    className="mt-1 block w-full rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 p-2"
                                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className="mt-1 block w-full rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 p-2"
                                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium" style={{ color: 'var(--muted-strong)' }}>Phone Number <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>(optional)</span></label>
                                <input
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    className="mt-1 block w-full rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 p-2"
                                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
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
                                className="w-full btn-primary font-bold py-2 rounded-md transition-all shadow-lg"
                            >
                                Sign Up
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>OR</span>
                            <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
                        </div>

                        {/* Google Sign-Up Button */}
                        <button
                            onClick={handleGoogleSignup}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-md font-medium transition-all duration-200 border cursor-pointer"
                            style={{
                                background: 'var(--input-bg)',
                                borderColor: 'var(--input-border)',
                                color: 'var(--foreground)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign up with Google
                        </button>
                    </>
                )}
                <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                    Already have an account? <Link href="/login" className="text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300">Log in</Link>
                </p>
            </div>
        </div>
    );
}
