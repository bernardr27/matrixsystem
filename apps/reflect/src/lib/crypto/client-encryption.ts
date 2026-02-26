
export async function generateKey(password: string, salt: string): Promise<CryptoKey> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error("SECURE_CONTEXT_REQUIRED: Encryption requires HTTPS or localhost.");
    }
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(key: CryptoKey, data: string): Promise<{ cipher: string, iv: string }> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error("SECURE_CONTEXT_REQUIRED: Encryption requires HTTPS or localhost.");
    }
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(data)
    );

    // Convert to Base64
    return {
        cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    };
}
