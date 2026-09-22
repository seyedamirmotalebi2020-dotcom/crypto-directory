// src/controllers/categoryStats.controller.js
import * as service from '../services/categoryStats.service.js'

export async function stats(req, res, next) {
  try {
    const data = await service.getCategoryStats()
    // Cache for 60s at the CDN level too
    res.set('Cache-Control', 'public, max-age=60')
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}