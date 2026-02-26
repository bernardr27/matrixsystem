'use client';

import { useState } from 'react';

export function useShare() {
    const [copied, setCopied] = useState(false);

    const share = async (title: string, text: string) => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                return true;
            } catch (err) {
                console.warn('Share cancelled', err);
                return false;
            }
        } else {
            // Fallback to Clipboard
            try {
                await navigator.clipboard.writeText(`${title}\n\n${text}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                return true;
            } catch (err) {
                console.error('Clipboard failed', err);
                return false;
            }
        }
    };

    return { share, copied };
}
