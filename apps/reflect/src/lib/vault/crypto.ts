/**
 * Reflect OS // Cognitive Vault Crypto Core
 * Implementing AES-GCM 256-bit E2EE for P2P Synchronization.
 */

export async function generateNeuralKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return Buffer.from(exported).toString('base64');
}

export async function encryptVault(data: any, base64Key: string): Promise<{ ciphertext: string; iv: string }> {
    const keyBuffer = Buffer.from(base64Key, 'base64');
    const key = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    return {
        ciphertext: Buffer.from(encrypted).toString('base64'),
        iv: Buffer.from(iv).toString('base64')
    };
}

export async function decryptVault(ciphertext: string, iv: string, base64Key: string): Promise<any> {
    const keyBuffer = Buffer.from(base64Key, 'base64');
    const key = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: Buffer.from(iv, 'base64') },
        key,
        Buffer.from(ciphertext, 'base64')
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
}
