// src/controllers/activity.controller.js
import * as service from '../services/activity.service.js'

export async function recent(req, res, next) {
  try {
    const data = await service.getRecentActivity()
    // Light caching — no need to hit the DB on every 15s poll from the same tab
    res.set('Cache-Control', 'public, max-age=10')
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}