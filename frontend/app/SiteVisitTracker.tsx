"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SiteVisitTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const trackVisit = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                await fetch(`${apiUrl}/notification/visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page: pathname }),
                });
            } catch {
                // Silently fail – don't affect user experience
            }
        };
        trackVisit();
    }, [pathname]);

    return null;
}
