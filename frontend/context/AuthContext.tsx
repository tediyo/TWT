"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isGuest: boolean;
    login: (token: string, user: User) => void;
    loginAsGuest: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to prevent SecurityError crashes
const safeStorage = {
    getItem: (type: 'local' | 'session', key: string) => {
        if (typeof window === 'undefined') return null;
        try { return type === 'local' ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (type: 'local' | 'session', key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try { type === 'local' ? window.localStorage.setItem(key, value) : window.sessionStorage.setItem(key, value); } catch (e) {}
    },
    removeItem: (type: 'local' | 'session', key: string) => {
        if (typeof window === 'undefined') return;
        try { type === 'local' ? window.localStorage.removeItem(key) : window.sessionStorage.removeItem(key); } catch (e) {}
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedToken = safeStorage.getItem('local', 'token');
        const savedUser = safeStorage.getItem('local', 'user');
        const savedGuest = safeStorage.getItem('session', 'isGuest');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        } else if (savedGuest === 'true') {
            setIsGuest(true);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        setIsGuest(false);
        safeStorage.setItem('local', 'token', newToken);
        safeStorage.setItem('local', 'user', JSON.stringify(newUser));
        safeStorage.removeItem('session', 'isGuest');
        router.push('/dashboard');
    }, [router]);

    const loginAsGuest = useCallback(() => {
        setToken(null);
        setUser(null);
        setIsGuest(true);
        safeStorage.setItem('session', 'isGuest', 'true');
        router.push('/dashboard');
    }, [router]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setIsGuest(false);
        safeStorage.removeItem('local', 'token');
        safeStorage.removeItem('local', 'user');
        safeStorage.removeItem('session', 'isGuest');
        router.push('/login');
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, token, isGuest, login, loginAsGuest, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

