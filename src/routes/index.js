// src/routes/index.js
import { Router } from 'express'
import * as sites           from '../controllers/sites.controller.js'
import * as categories      from '../controllers/categories.controller.js'
import * as reference       from '../controllers/reference.controller.js'
import * as votes           from '../controllers/votes.controller.js'
import * as activity        from '../controllers/activity.controller.js'
import * as categoryStats   from '../controllers/categoryStats.controller.js'
import { voteLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.get('/sites',             sites.list)
router.get('/sites/:slug',       sites.detail)
router.post('/sites/:slug/vote', voteLimiter, votes.cast)

router.get('/activity',          activity.recent)
router.get('/category-stats',    categoryStats.stats)

router.get('/categories',        categories.tree)
router.get('/coins',             reference.coins)
router.get('/payment-methods',   reference.paymentMethods)
router.get('/features',          reference.features)

export default router