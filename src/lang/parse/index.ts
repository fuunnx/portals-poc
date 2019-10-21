import { map, flatten } from 'ramda'
import { tokenize } from './tokenize'
export { cleanupContent } from './cleanupContent'
import { referencePortals } from './referencePortals'
import { fromArray, update, values } from '@collectable/sorted-map'
import { Context, Portal, Symbol, Token, Content } from '../types'
import { TextLine, DestinationLine, OpeningLine, EndingLine } from './Line'

type TokensMap = Array<[number, Token]>

export function parse(
  text: string,
  operations?: {
    add?: TokensMap
    move?: { target: number; offset: number }
  },
): Context {
  const tokens = text.split('\n').map((line, index) => [index, tokenize(line)])

  const indexedTokens = [
    ...tokens,
    ...((operations && operations.add) || []),
  ].map(([k, v]) => [Number(k), v] as [number, Token]) // <-- fuck you typescript

  const portals = referencePortals(indexedTokens, operations && operations.move)

  const ctx = indexedTokens.reduce(
    (context, [index, token]) => {
      let targetIndex = index
      if (operations && operations.move) {
        if (index === operations.move.target) {
          targetIndex = index + operations.move.offset
        }
      }
      const push = pushWithContext(context, targetIndex)

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
    portals: map(computePortalSize, ctx.portals),
  }
}

function computePortalSize(portal: Portal): Portal {
  const content = flatten(Array.from(values(portal.content)))

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
