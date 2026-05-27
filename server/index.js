import 'dotenv/config'
import express from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import postsRouter from './routes/posts.js'
import tagsRouter from './routes/tags.js'
import mediaRouter from './routes/media.js'
import configRouter from './routes/config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

const conf = JSON.parse(readFileSync(join(__dirname, '..', 'conf.json'), 'utf-8'))
app.locals.conf = conf

app.use(express.json())

app.use('/api/posts', postsRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/media', mediaRouter)
app.use('/api/config', configRouter)

app.get('/api/version', (req, res) => {
  res.json({ version: '0.1.0' })
})

const distPath = join(__dirname, '..', 'client', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, HOST, () => {
  console.log(`subooru running on http://${HOST}:${PORT}`)
})
