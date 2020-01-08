import {
  Context,
  Content,
  Symbol,
  Opening,
  Destination,
  Ending,
} from '../types'
import { to2dArray } from '../parse/cleanupContent'

const SEPARATOR = '\n'

export function stringify(context: Context): string {
  const lines = context.buffer.split(SEPARATOR)

  const toString = {
    opening: (symbol: Opening) => `PORTAL #${symbol.for}`,
    ending: (symbol: Ending) => `/PORTAL #${symbol.for}`,
    destination: (symbol: Destination) => `WARP #${symbol.for}`,
    text: (symbol: Symbol) =>
      lines.slice(symbol.start, (symbol.end || 0) + 1).join(SEPARATOR),
    placeholder: () => '',
  }

  return flattenSymbols(context.content).join(SEPARATOR)

  function flattenSymbols(content: Content): string[] {
    return to2dArray(content).reduce((acc: string[], symbols) => {
      let line = symbols
        .map(symbol => toString[symbol.type](symbol as any))
        .join(', ')

      if (symbols.some(x => x.type !== 'text')) {
        const left = Math.max(1, symbols[0].left || 0)
        acc.push(' '.repeat(Number.isFinite(left) ? left : 0) + `// ${line}`)
      } else {
        acc.push(line)
      }

      symbols.forEach(symbol => {
        if (symbol.type === 'opening') {
          acc.push(...flattenSymbols(context.portals[symbol.for].content))
        }
      })

      return acc
    }, [])
  }
}
