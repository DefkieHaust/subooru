import pino from 'pino'

let _instance = pino({ level: 'silent' })

export function getLogger() {
  return _instance
}

export function initLogger(config) {
  if (!config) return
  const level = config.level || 'info'
  const targets = []
  if (config.console !== false) {
    targets.push({ target: 'pino-pretty', options: { colorize: true }, level })
  }
  if (config.file) {
    targets.push({ target: 'pino/file', options: { destination: config.file, mkdir: true }, level })
  }
  if (targets.length) {
    const transport = pino.transport({ targets })
    _instance = pino({ level }, transport)
  } else {
    _instance = pino({ level })
  }
}
