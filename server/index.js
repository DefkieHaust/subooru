import app from './app.js'
import { getLogger } from './logger.js'

const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

const GIT_COMMIT = process.env.GIT_COMMIT || 'unknown'

app.listen(PORT, HOST, () => {
  getLogger().info({ port: PORT, host: HOST, git_commit: GIT_COMMIT }, `subooru running on http://${HOST}:${PORT}`)
})
