import { map, last } from 'ramda'
import { Context, Portal, Dict, Content, Symbols } from '../types'
import { toSortedArray } from '../../libs/SortedMap'

export interface CleanPortal extends Omit<Portal, 'content'> {
  content: Array<Symbols>
}

export interface CleanContext
  extends Omit<Omit<Context, 'content'>, 'portals'> {
  content: Array<Symbols>
  portals: Dict<CleanPortal>
}

export function cleanupContent(context: Context): CleanContext {
  return {
    ...context,
    portals: map(portal => {
      return {
        ...portal,
        start: makeFinite(portal.start),
        end: makeFinite(portal.end),
        left: makeFinite(portal.left),
        right: makeFinite(portal.right),
        content: cleanup(portal.content),
      }
    }, context.portals),
    content: cleanup(context.content),
  }

  function cleanup(content: Content): Array<Symbols> {
    return toSortedArray(content)
      .reduce(
        (acc, symbols) => {
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
        },
        [] as Array<Symbols>,
      )
      .map(symbols =>
        symbols.map(symbol => {
          return {
            ...symbol,
            start: makeFinite(symbol.start),
            end: makeFinite(symbol.end),
            left: makeFinite(symbol.left),
            right: makeFinite(symbol.right),
          }
        }),
      )
  }
}

function makeFinite(num: any): number {
  return Number.isFinite(num) ? num : 0
}
