import * as service from '../services/categories.service.js'

export async function tree(req, res, next) {
  try {
    const data = await service.getCategoryTree()
    res.json({ ok: true, data })
  } catch (err) { next(err) }
}