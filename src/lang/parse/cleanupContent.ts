import { map, last, identity } from 'ramda'
import {
  Context,
  Portal,
  Dict,
  Content,
  Symbols,
  Symbol,
  BoundingRect,
} from '../types'
import { toSortedArray } from '../../libs/SortedMap'

export interface CleanPortal extends Omit<Portal, 'content'> {
  content: Symbol[][]
}

export interface CleanContext
  extends Omit<Omit<Omit<Context, 'content'>, 'portals'>, 'buffer'> {
  content: Symbol[][]
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
        boundingRect: makeFiniteBounds(portal.boundingRect),
        content: cleanupContent(portal.content, mapperFn),
      }
    }, context.portals),
    content: cleanupContent(context.content, mapperFn),
  }
}

export function to2dArray(content: Content): Symbol[][] {
  return map(toSortedArray, toSortedArray(content))
}

export function cleanupContent(
  content: Content,
  mapperFn: SymbolMapper<Symbol> = identity,
): Symbol[][] {
  return to2dArray(content)
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

      let prevBR = prev.boundingRect
      symbols.forEach((curr, columnIndex) => {
        let currBR = curr.boundingRect
        prevBR.lineStart = Math.min(prevBR.lineStart, currBR.lineStart) || 0
        prevBR.lineEnd = Math.max(0, prevBR.lineEnd || 0, currBR.lineEnd || 0)
        prevBR.columnStart =
          Math.min(prevBR.columnStart, currBR.columnStart) || 0
        prevBR.columnEnd = Math.max(0, prevBR.columnEnd, currBR.columnEnd)
      })
      return acc
    }, [] as Symbol[][])
    .map(symbols =>
      symbols.map(symbol => {
        return mapperFn({
          ...symbol,
          boundingRect: makeFiniteBounds(symbol.boundingRect),
        })
      }),
    )
}

function makeFinite(num: any): number {
  return Number.isFinite(num) ? num : 0
}

function makeFiniteBounds(boundingRect: BoundingRect): BoundingRect {
  return {
    lineStart: makeFinite(boundingRect.lineStart),
    lineEnd: makeFinite(boundingRect.lineEnd),
    columnStart: makeFinite(boundingRect.columnStart),
    columnEnd: makeFinite(boundingRect.columnEnd),
  }
}
