"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedGuest = sessionStorage.getItem('isGuest');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        } else if (savedGuest === 'true') {
            setIsGuest(true);
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        setIsGuest(false);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        sessionStorage.removeItem('isGuest');
        router.push('/dashboard');
    };

    const loginAsGuest = () => {
        setToken(null);
        setUser(null);
        setIsGuest(true);
        sessionStorage.setItem('isGuest', 'true');
        router.push('/dashboard');
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsGuest(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('isGuest');
        router.push('/login');
    };

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

