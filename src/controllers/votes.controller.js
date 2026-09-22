// src/controllers/votes.controller.js
import * as service from '../services/votes.service.js'

export async function cast(req, res, next) {
  try {
    const result = await service.recordVote({
      slug: req.params.slug,
      vote: req.body?.vote,
      fingerprintRaw: req.body?.fingerprint,
      ipRaw: req.ip,
      userAgent: req.get('user-agent'),
    })
    res.json({ ok: true, data: result })
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, error: err.message })
    }
    next(err)
  }
}