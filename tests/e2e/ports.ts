/** Ports of the static servers the end-to-end tests run against (see playwright.config.ts). */
export const PORTS = { gallery: 4173, basic: 4174, full: 4175 } as const

export const origin = (name: keyof typeof PORTS): string => `http://127.0.0.1:${PORTS[name]}/`
