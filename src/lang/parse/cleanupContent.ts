import { map, last, identity } from 'ramda'
import { Context, Portal, Dict, Content, Symbols, Symbol } from '../types'
import { toSortedArray } from '../../libs/SortedMap'

export interface CleanPortal extends Omit<Portal, 'content'> {
  content: Array<Symbols>
}

export interface CleanContext
  extends Omit<Omit<Omit<Context, 'content'>, 'portals'>, 'buffer'> {
  content: Array<Symbols>
  portals: Dict<CleanPortal>
}

type SymbolMapper<T = any> = {
  (symbol: Symbol): T
}

export function cleanupContext(
  context: Context,
  mapperFn: SymbolMapper<Symbol> = identity,
): CleanContext {
  return {
    portals: map(portal => {
      return {
        ...portal,
        start: makeFinite(portal.start),
        end: makeFinite(portal.end),
        left: makeFinite(portal.left),
        right: makeFinite(portal.right),
        content: cleanupContent(portal.content, mapperFn),
      }
    }, context.portals),
    content: cleanupContent(context.content, mapperFn),
  }
}

export function cleanupContent(
  content: Content,
  mapperFn: SymbolMapper<Symbol> = identity,
): Array<Symbols> {
  return toSortedArray(content)
    .reduce((acc, symbols) => {
      const prevs = last(acc)

      if (
        !prevs ||
        prevs.some(x => x.type !== 'text') ||
        symbols.some(x => x.type !== 'text')
      ) {
        acc.push(symbols)
        return acc
      }

      const prev = last(prevs)

      if (!prev) {
        acc.push(symbols)
        return acc
      }

      symbols.forEach(curr => {
        prev.start = Math.min(prev.start, curr.start) || 0
        prev.end = Math.max(0, prev.end || 0, curr.end || 0)
        prev.left = Math.min(prev.left, curr.left) || 0
        prev.right = Math.max(0, prev.right, curr.right)
      })
      return acc
    }, [] as Array<Symbols>)
    .map(symbols =>
      symbols.map(symbol => {
        return mapperFn({
          ...symbol,
          start: makeFinite(symbol.start),
          end: makeFinite(symbol.end),
          left: makeFinite(symbol.left),
          right: makeFinite(symbol.right),
        })
      }),
    )
}

function makeFinite(num: any): number {
  return Number.isFinite(num) ? num : 0
}
