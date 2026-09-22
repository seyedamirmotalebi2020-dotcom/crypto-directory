import * as service from '../services/sites.service.js'

export async function list(req, res, next) {
  try {
    const { data, meta } = await service.listSites(req.query)
    res.json({ ok: true, data, meta })
  } catch (err) { next(err) }
}

export async function detail(req, res, next) {
  try {
    const site = await service.getSiteBySlug(req.params.slug)
    if (!site) return res.status(404).json({ ok: false, error: 'Site not found' })
    res.json({ ok: true, data: site })
  } catch (err) { next(err) }
}