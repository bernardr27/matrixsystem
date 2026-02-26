export function isSafeMode(): boolean {
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('safe') === '1') return true;
    }

    if (process.env.NEXT_PUBLIC_SAFE_MODE === 'true') return true;

    // Automatic fallback removed to prevent forced Mock User
    // const hasApiKey = !!process.env.NEXT_PUBLIC_AI_API_KEY || (process.env.NEXT_PUBLIC_AI_BASE_URL?.includes('localhost'));
    // if (!hasApiKey) return true;

    return false;
}
