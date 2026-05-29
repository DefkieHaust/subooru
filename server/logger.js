import pino from 'pino'

let _instance = pino({ level: 'silent' })

export function getLogger() {
  return _instance
}

export function initLogger(config) {
  if (!config) return
  const targets = []
  if (config.console !== false) {
    targets.push({ target: 'pino-pretty', options: { colorize: true } })
  }
  if (config.file) {
    targets.push({ target: 'pino/file', options: { destination: config.file, mkdir: true } })
  }
  _instance = pino({
    level: config.level || 'info',
    transport: targets.length ? { targets } : undefined
  })
}
