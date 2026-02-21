/**
 * Basic Web Crypto API wrapper for encrypting sensitive data before writing to chrome.storage.local.
 * Extension architecture doesn't have a perfectly secure native enclave for a master key that
 * doesn't require user input on every invocation, so we use a hardcoded/derived salt and local storage
 * key as a deterrent against casual scraping/plaintext scanning tools.
 */

const SALT = 'xpaper-salt-v1';
const ITERATIONS = 100000;

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Derive a consistent AES-GCM key from the extension ID or fallback
async function getEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const password = chrome?.runtime?.id || 'xpaper-dev-fallback-key';
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT),
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptText(text: string): Promise<string> {
    if (!text) return text;

    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(text)
    );

    const payload = new Uint8Array(iv.length + ciphertext.byteLength);
    payload.set(iv, 0);
    payload.set(new Uint8Array(ciphertext), iv.length);

    return bufferToBase64(payload.buffer);
}

export async function decryptText(encryptedBase64: string): Promise<string> {
    if (!encryptedBase64) return encryptedBase64;

    try {
        const key = await getEncryptionKey();
        const payload = new Uint8Array(base64ToBuffer(encryptedBase64));
        const iv = payload.slice(0, 12);
        const ciphertext = payload.slice(12);

        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext.buffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(plaintext);
    } catch (e) {
        console.error('Failed to decrypt data', e);
        return ''; // Return empty string indicating decryption failure or broken key
    }
}
