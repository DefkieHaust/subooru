import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import postsRouter from './routes/posts.js'
import tagsRouter from './routes/tags.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

app.use(express.json())

app.use('/api/posts', postsRouter)
app.use('/api/tags', tagsRouter)

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
