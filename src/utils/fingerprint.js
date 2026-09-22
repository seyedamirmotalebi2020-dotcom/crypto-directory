// src/utils/fingerprint.js
import crypto from 'node:crypto'

const PEPPER = process.env.FINGERPRINT_PEPPER || 'dev-fallback-change-me'

function hmac(value) {
  return crypto
    .createHmac('sha256', PEPPER)
    .update(String(value || ''))
    .digest('hex')
    .slice(0, 64)
}

export function hashFingerprint(raw) {
  return hmac(raw)
}

export function hashIp(ip) {
  return hmac(ip)
}