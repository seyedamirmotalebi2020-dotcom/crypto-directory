import * as repo from '../repositories/reference.repo.js'

export async function coins(req, res, next) {
  try { res.json({ ok: true, data: await repo.findAllCoins() }) }
  catch (err) { next(err) }
}

export async function paymentMethods(req, res, next) {
  try { res.json({ ok: true, data: await repo.findAllPaymentMethods() }) }
  catch (err) { next(err) }
}

export async function features(req, res, next) {
  try { res.json({ ok: true, data: await repo.findAllFeatures() }) }
  catch (err) { next(err) }
}