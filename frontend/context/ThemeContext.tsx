"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to prevent SecurityError crashes when cookies are blocked
const safeStorage = {
    getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try { window.localStorage.setItem(key, value); } catch (e) {}
    }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = safeStorage.getItem('theme') as Theme | null;
        if (saved) {
            setTheme(saved);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        safeStorage.setItem('theme', theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
