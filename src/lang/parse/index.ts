import { map, flatten, pipe } from 'ramda'
import { tokenize } from './tokenize'
export { cleanupContent } from './cleanupContent'
import { referencePortals } from './referencePortals'
import { fromArray, update } from '@collectable/sorted-map'
import { Context, Portal, Symbol, Token, Content, Id } from '../types'
import { TextLine, DestinationLine, OpeningLine, EndingLine } from './Line'
import { toSortedArray } from '../../libs/SortedMap'

type TokensMap = Array<[number, Token]>

export function parse(
  text: string,
  operations?: {
    add?: TokensMap
    move?: { id: Id; target: number }
    copy?: { id: Id; target: number }
  },
): Context {
  const tokens = tokenize(text)
  const indexedTokens = [
    ...tokens,
    ...((operations && operations.add) || []),
  ].map(([k, v]) => [Number(k), v] as [number, Token]) // <-- fuck you typescript

  const portals = referencePortals(indexedTokens)
  const ctx = indexedTokens.reduce(
    (context, [index, token]) => {
      function push(symbol: Symbol) {
        let ctx = context
        if (operations?.move && token.id === operations.move.id) {
          ctx = pushWithContext(ctx, operations.move.target)(symbol)
        } else {
          ctx = pushWithContext(ctx, index)(symbol)
        }

        if (operations?.copy && token.id === operations.copy.id) {
          ctx = pushWithContext(ctx, operations.copy.target)(symbol)
        }

        return ctx
      }

      if (token.tag === 'text' || !token.portal || !portals[token.portal]) {
        return push(TextLine(index, token))
      }

      if (token.tag === 'warp') {
        return push(DestinationLine(index, token))
      }

      if (token.tag === 'portal') {
        if (token.pos === 'start') {
          return push(OpeningLine(index, token))
        }

        if (token.pos === 'end') {
          return push(EndingLine(index, token))
        }
      }
      return context
    },
    { content: fromArray([]), portals } as Context,
  )

  return {
    ...ctx,
    buffer: text,
    portals: map(computePortalSize, ctx.portals),
  }
}

function computePortalSize(portal: Portal): Portal {
  const content = flatten(toSortedArray(portal.content)) as Symbol[]

  const right = content.reduce((max, curr) => {
    return Math.max(max, curr.right)
  }, 0)

  const left = content.reduce((min, curr) => {
    return Math.min(min, curr.left)
  }, Infinity)

  return {
    ...portal,
    right,
    left,
  }
}

function pushWithContext(context: Context, index: number) {
  function _push(container: Context, x: Symbol): Context
  function _push(container: Portal, x: Symbol): Portal
  function _push(container: { content: Content }, x: Symbol) {
    container.content = update(
      symbols => {
        if (!symbols) return [x]
        symbols.push(x)
        return symbols
      },
      index,
      container.content,
    )
    return container
  }

  return function push(toPush: Symbol): Context {
    let openedPortals = Object.values(context.portals).filter(portal => {
      return portal.start <= index && index <= portal.end
    })

    let found = undefined
    for (let portal of openedPortals) {
      if ('for' in toPush && portal.id === toPush.for) {
        continue
      }
      if (!found) {
        found = portal
        continue
      }
      if (found.start <= portal.start && portal.end <= found.end) {
        found = portal
      }
    }

    if (found) {
      _push(found, toPush)
      return context
    }

    return _push(context, toPush)
  }
}
