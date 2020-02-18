import { map, flatten } from 'ramda'
import { tokenize } from './tokenize'
export { cleanupContent } from './cleanupContent'
import { referencePortals } from './referencePortals'
import { fromArray, update, set, has } from '@collectable/sorted-map'
import { Context, Portal, Symbol, Token, Content, Id } from '../types'
import { TextLine, DestinationLine, OpeningLine, EndingLine } from './Line'
import { to2dArray } from './cleanupContent'

type TokensMap = Array<[number, Token]>

export function parse(
  text: string,
  operations?: {
    add?: TokensMap
    move?: { id: Id; lineIndex: number; columnIndex: number }
    copy?: { id: Id; lineIndex: number; columnIndex: number }
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
          ctx = pushWithContext(
            ctx,
            operations.move.lineIndex,
            operations.move.columnIndex,
          )(symbol)
        } else {
          ctx = pushWithContext(ctx, index, 0)(symbol)
        }

        if (operations?.copy && token.id === operations.copy.id) {
          ctx = pushWithContext(
            ctx,
            operations.copy.lineIndex,
            operations.copy.columnIndex,
          )(symbol)
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
    content: ctx.content,
    buffer: text,
    portals: map(computePortalSize, ctx.portals),
  }
}

function computePortalSize(portal: Portal): Portal {
  const content = flatten(to2dArray(portal.content)) as Symbol[]

  const columnStart = content.reduce((max, curr) => {
    return Math.max(max, curr.boundingRect.columnStart)
  }, 0)

  const columnEnd = content.reduce((min, curr) => {
    return Math.min(min, curr.boundingRect.columnEnd)
  }, Infinity)

  return {
    ...portal,
    boundingRect: {
      ...portal.boundingRect,
      columnStart,
      columnEnd,
    },
  }
}

function pushWithContext(
  context: Context,
  lineIndex: number,
  columnIndex: number,
) {
  function _push(container: Context, x: Symbol): Context
  function _push(container: Portal, x: Symbol): Portal
  function _push(container: { content: Content }, symbol: Symbol) {
    container.content = update(
      (symbols = fromArray([])) => {
        let index = columnIndex
        let topIndex = Math.floor(columnIndex + 1)
        while (has(index, symbols)) {
          index = (index + topIndex) / 2
        }

        return set(
          index,
          { ...symbol, position: { line: lineIndex, column: index } },
          symbols,
        )
      },
      lineIndex,
      container.content,
    )
    return container
  }

  return function push(toPush: Symbol): Context {
    let openedPortals = Object.values(context.portals).filter(portal => {
      return (
        portal.boundingRect.lineStart <= lineIndex &&
        lineIndex <= portal.boundingRect.lineEnd
      )
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
      if (
        found.boundingRect.lineStart <= portal.boundingRect.lineStart &&
        portal.boundingRect.lineEnd <= found.boundingRect.lineEnd
      ) {
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
