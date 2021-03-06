import {
  Context,
  Content,
  Symbol,
  Opening,
  Destination,
  Ending,
} from '../types'
import { to2dArray } from '../parse/cleanupContent'
import { verbs } from '../../config'

export function stringify(context: Context): string {
  const lines = context.buffer.split('\n')

  const toString = {
    opening: (symbol: Opening) =>
      `${verbs.portalStart} ${verbs.id}${symbol.for}`,

    ending: (symbol: Ending) => `${verbs.portalEnd} ${verbs.id}${symbol.for}`,

    destination: (symbol: Destination) =>
      `${verbs.warp} ${verbs.id}${symbol.for}`,

    text: ({ boundingRect }: Symbol) => {
      const text = lines
        .slice(boundingRect.lineStart, (boundingRect.lineEnd || 0) + 1)
        .join('\n')
      if (boundingRect.lineStart !== boundingRect.lineEnd) {
        return text
      }

      return text.slice(boundingRect.columnStart, boundingRect.columnEnd + 1)
    },
    placeholder: () => '',
  }

  return flattenSymbols(context.content).join('\n')

  function flattenSymbols(content: Content): string[] {
    return to2dArray(content).reduce((acc: string[], symbols) => {
      let line = symbols
        .map((symbol, index) => {
          let str = toString[symbol.type](symbol as any)
          if (symbol.type !== 'text' && index !== symbols.length - 1) {
            str += ', '
          }
          return str
        })
        .join('')

      if (symbols.some(x => x.type !== 'text')) {
        const left = Math.max(0, symbols[0].boundingRect.columnStart || 0)
        acc.push(
          ' '.repeat(Number.isFinite(left) ? left : 0) +
            `${verbs.comment} ${line}`,
        )
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
