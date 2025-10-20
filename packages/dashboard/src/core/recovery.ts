const encoder = new TextEncoder();

export function generateRecoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';
  for (let i = 0; i < 16; i += 1) {
    raw += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return raw.match(/.{1,4}/g)!.join('-');
}

async function sha256(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashRecovery(code: string, salt: string): Promise<string> {
  return sha256(encoder.encode(`${salt}:${code}`));
}
