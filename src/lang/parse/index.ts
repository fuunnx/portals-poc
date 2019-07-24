import { is, map } from 'ramda'
import { tokenize } from './tokenize'
import { cleanupContent } from './cleanupContent'
import { referencePortals } from './referencePortals'
import { Context, Portal, BufferContent } from '../types'
import { TextLine, DestinationLine, OpeningLine, EndingLine } from './Line'

export function parse(text: string): Context {
  const tokens = text.split('\n').map(line => tokenize(line) || line)

  const portals = referencePortals(tokens)
  const ctx = tokens.reduce(
    (context, token, index) => {
      const push = pushToContext(context, index)

      if (is(String, token)) {
        return push(TextLine(index, token))
      }

      if (!portals[token.id]) {
        return push(TextLine(index, token.original))
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
    { content: [], portals } as Context,
  )

  return cleanupContent({
    ...ctx,
    portals: map(computePortalSize, ctx.portals)
  })
}

function computePortalSize(portal: Portal): Portal {
  const right = (portal.content || []).reduce((max, curr) => {
    return Math.max(max, curr.right)
  }, 0)

  const left = (portal.content || []).reduce((min, curr) => {
    return Math.min(min, curr.left)
  }, Infinity)

  return {
    ...portal,
    right,
    left,
  }
}


function pushToContext(
  context: Context,
  index: number,
) {
  return function push(toPush: BufferContent): Context {
    let openedPortals = Object.values(context.portals).filter(portal => {
      return portal.start <= index && index <= portal.end
    })

    if (!openedPortals.length) {
      context.content.push(toPush)
      return context
    }

    openedPortals.forEach(portal => {
      const smallerPortalsInside = openedPortals.some(x => {
        return (
          x.id !== portal.id && portal.start <= x.start && x.start <= portal.end
        )
      })
      if (!smallerPortalsInside) {
        portal.content.push(toPush)
      }
    })
    return context
  }
}
