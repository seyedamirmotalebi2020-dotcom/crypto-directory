import express from 'express'
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import apiRouter from './src/routes/index.js'
import { prisma } from './src/config/db.js'
import { generateSitemap } from './src/services/sitemap.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.set('trust proxy', 1)
app.use(express.json())

// ── Dynamic sitemap (must be before static so it isn't shadowed) ──
app.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await generateSitemap()
    res.set('Content-Type', 'application/xml; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=900') // 15 min
    res.send(xml)
  } catch (err) {
    console.error('Sitemap error:', err)
    res.status(500).send('Sitemap generation failed')
  }
})

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  index: 'index.html',
}))

// Health check
app.get('/health', async (req, res) => {
  try {
    const categories = await prisma.category.count()
    const sites      = await prisma.site.count()
    res.json({ ok: true, categories, sites })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Crypto landing page
app.get('/crypto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crypto.html'))
})

// Earning-method landing pages
app.get('/earn/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'earn.html'))
})

// Site detail pages
app.get('/site/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'site.html'))
})

// API
app.use('/api', apiRouter)

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ ok: false, error: 'Not found' })
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ ok: false, error: err.message || 'Server error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`))