import app from './app.js'
import { getLogger } from './logger.js'

const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  getLogger().info({ port: PORT, host: HOST }, `subooru running on http://${HOST}:${PORT}`)
})
