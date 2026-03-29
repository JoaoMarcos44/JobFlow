const KEY_STORAGE = 'jobflow_resume_aes_jwk';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function getResumeStorageKey(): Promise<CryptoKey> {
  const raw = localStorage.getItem(KEY_STORAGE);
  if (raw) {
    return crypto.subtle.importKey('jwk', JSON.parse(raw) as JsonWebKey, { name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]);
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(KEY_STORAGE, JSON.stringify(jwk));
  return key;
}

export async function encryptResumePayload(plain: Uint8Array): Promise<{ ivHex: string; cipherHex: string }> {
  const key = await getResumeStorageKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(plain);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    ivHex: bytesToHex(iv),
    cipherHex: bytesToHex(new Uint8Array(ciphertext)),
  };
}

export async function decryptResumePayload(ivHex: string, cipherHex: string): Promise<Uint8Array> {
  const key = await getResumeStorageKey();
  const iv = new Uint8Array(hexToBytes(ivHex));
  const cipher = new Uint8Array(hexToBytes(cipherHex));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new Uint8Array(plain);
}
