// src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit'

// Vote endpoint: max 20 votes per minute per IP
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many votes — slow down.' },
  // Trust proxy headers so the real client IP is used behind Cloudflare / Railway / Render
  validate: { trustProxy: false },
})

// Read endpoint limiter for the whole API — optional, add later
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Rate limit reached.' },
})