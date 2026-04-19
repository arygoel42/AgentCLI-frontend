import { randomBytes, createHash } from "crypto"

export function generateApiKey(): string {
  const random = randomBytes(24).toString("base64url")
  return `petl_pk_${random}`
}

// SHA-256 is appropriate here — API keys are long random strings, not passwords
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

export function getApiKeyHint(key: string): string {
  return key.slice(-4)
}

export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash
}
