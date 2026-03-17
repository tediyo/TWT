"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Suspense } from 'react';

function GoogleCallbackContent() {
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');

        if (token && userId && email) {
            login(token, { id: Number(userId), email });
        } else {
            setError('Google authentication failed. Please try again.');
        }
    }, [searchParams, login]);

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass w-full max-w-md p-8 space-y-4 shadow-2xl text-center">
                {error ? (
                    <>
                        <div className="text-red-500 text-lg font-semibold">{error}</div>
                        <a
                            href="/login"
                            className="inline-block mt-4 btn-primary text-white font-bold py-2 px-6 rounded-md transition-all shadow-lg"
                        >
                            Back to Login
                        </a>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                            Signing you in...
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            Please wait while we complete authentication.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="glass w-full max-w-md p-8 space-y-4 shadow-2xl text-center">
                    <div className="flex justify-center">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Loading...</p>
                </div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}
