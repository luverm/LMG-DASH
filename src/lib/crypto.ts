import { base64ToBytes, bytesToBase64 } from './storage/base64'

/** Ciphertext plus the parameters needed to decrypt it. All fields base64. */
export interface SealedBox {
  salt: string
  iv: string
  data: string
  iterations: number
}

const ITERATIONS = 310_000

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function seal(
  plaintext: string,
  passphrase: string,
  iterations = ITERATIONS,
): Promise<SealedBox> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, iterations)
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return {
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(data)),
    iterations,
  }
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('Wrong passphrase')
    this.name = 'WrongPassphraseError'
  }
}

export async function open(box: SealedBox, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase, base64ToBytes(box.salt), box.iterations)
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(box.iv) },
      key,
      base64ToBytes(box.data),
    )
    return new TextDecoder().decode(plain)
  } catch {
    throw new WrongPassphraseError()
  }
}
