import { map, flatten } from 'ramda'
import { tokenize } from './tokenize'
export { cleanupContent } from './cleanupContent'
import { referencePortals } from './referencePortals'
import { fromArray, update, values, set } from '@collectable/sorted-map'
import { Context, Portal, NumDict, BufferContent, Token } from '../types'
import { TextLine, DestinationLine, OpeningLine, EndingLine } from './Line'



export function parse(text: string, virtualTokens?: NumDict<Token>): Context {
  const tokens = text.split('\n').map((line, index) => [index, tokenize(line)])

  const indexedTokens = [
    ...tokens,
    ...Object.entries(virtualTokens || {}),
  ].map(([k, v]) => [Number(k), v] as [number, Token])  // <-- fuck you typescript

  const portals = referencePortals(indexedTokens)

  const ctx = indexedTokens.reduce(
    (context, [index, token]) => {
      const push = pushWithContext(context, index)

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

  return ({
    ...ctx,
    portals: map(computePortalSize, ctx.portals)
  })
}

function computePortalSize(portal: Portal): Portal {
  const content = flatten(Array.from(values((portal.content))))

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

function pushWithContext(
  context: Context,
  index: number,
) {
  function _push<T extends Context | Portal>(container: T, x: BufferContent) {
    container.content = update(() => x, index, container.content)
    return container
  }

  return function push(toPush: BufferContent): Context {
    let openedPortals = Object.values(context.portals).filter(portal => {
      return portal.start <= index && index <= portal.end
    })

    if (!openedPortals.length) {
      return _push(context, toPush)
    }

    openedPortals.forEach(portal => {
      const smallerPortalsInside = openedPortals.some(x => {
        return (
          x.id !== portal.id && portal.start <= x.start && x.start <= portal.end
        )
      })
      if (!smallerPortalsInside) {
        _push(portal, toPush)
      }
    })
    return context
  }
}
