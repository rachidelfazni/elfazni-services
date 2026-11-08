export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('$pbkdf2-sha256$')) return input === stored;
  const [, , rounds, salt, expected] = stored.split('$');
  if (!salt || !expected || !/^\d+$/.test(rounds)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(input), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:Number(rounds),salt:Uint8Array.from(salt.match(/../g)!, v=>parseInt(v,16))},key,256);
  const actual = Array.from(new Uint8Array(bits), n=>n.toString(16).padStart(2,'0')).join('');
  return actual === expected;
}
