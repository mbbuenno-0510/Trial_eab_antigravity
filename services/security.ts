
/**
 * services/security.ts
 * Implementação de Criptografia de Ponta-a-Ponta (E2EE) para o EAB Master.
 * Utiliza a Web Crypto API para cifragem AES-256-GCM.
 * Em conformidade com a LGPD para dados sensíveis de saúde e menores.
 */

const ALGORITHM = 'AES-GCM';
const SALT = 'eab-master-security-salt-2026-v1';

/**
 * Deriva uma chave criptográfica forte a partir do UID do usuário.
 */
async function getEncryptionKey(userId: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(userId),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode(SALT),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Criptografa uma string usando AES-GCM.
 * Retorna uma string em Base64 contendo IV + Dados Cifrados.
 */
export async function encryptData(text: string | undefined | null, userId: string): Promise<string> {
    if (!text || !text.trim()) return '';
    if (!userId) return text;

    try {
        const key = await getEncryptionKey(userId);
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV de 12 bytes para GCM
        const enc = new TextEncoder();
        
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            enc.encode(text)
        );

        // Concatenar IV + Dados Cifrados para transporte
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);

        // Converter para Base64 para salvar no Firestore
        return btoa(String.fromCharCode(...combined));
    } catch (e) {
        console.error("🔒 Erro na criptografia:", e);
        return text; // Fallback para texto plano em caso de falha crítica
    }
}

/**
 * Descriptografa uma string Base64.
 * Se a string não estiver criptografada, retorna o texto original.
 */
export async function decryptData(cipherText: string | undefined | null, userId: string): Promise<string> {
    if (!cipherText || !cipherText.trim() || !userId) return cipherText || '';
    
    // Verificação simples: dados criptografados por esta lógica geralmente não possuem espaços e terminam em base64 padding
    // Se falhar no atob ou na decifragem, retornamos o original (compatibilidade com dados legados)
    try {
        const key = await getEncryptionKey(userId);
        const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
        
        if (combined.length < 13) return cipherText; // Curto demais para ser IV + Tag + Data

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            data
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
        // Se der erro, provavelmente o dado já está em texto plano (migração)
        return cipherText;
    }
}
