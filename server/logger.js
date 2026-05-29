import pino from 'pino'

let _instance = pino({ level: 'silent' })

export const logger = {
  info: (o, m) => _instance.info(o, m),
  warn: (o, m) => _instance.warn(o, m),
  error: (o, m) => _instance.error(o, m),
  debug: (o, m) => _instance.debug(o, m),
  child: (b) => _instance.child(b)
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
